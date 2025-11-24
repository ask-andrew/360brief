/**
 * Contact Normalization Service
 * 
 * Unifies different email addresses to single contact identities.
 * Handles cases like:
 * - john.doe@company.com
 * - john@company.com  
 * - jdoe@company.com
 * → All map to canonical: "John Doe <john.doe@company.com>"
 * 
 * Critical for accurate metrics - without this, one person becomes multiple contacts.
 */

import { createClient } from '@supabase/supabase-js';

export interface ContactProfile {
  id?: string;
  canonicalEmail: string;
  displayName?: string;
  emailAddresses: string[];
  domain: string;
  isInternal: boolean;
  relationshipType?: 'direct_report' | 'manager' | 'client' | 'vendor' | 'team' | 'other';
  importanceWeight: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export class ContactNormalizationService {
  private emailToCanonical: Map<string, string> = new Map();
  private canonicalToProfile: Map<string, ContactProfile> = new Map();
  
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private userEmail: string
  ) {}
  
  /**
   * Load existing contacts from database
   */
  async loadExistingContacts(userId: string): Promise<void> {
    console.log('📇 Loading existing contacts...');
    
    const { data: participants, error } = await this.supabase
      .from('participants')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Error loading participants:', error);
      return;
    }
    
    for (const participant of participants || []) {
      const profile: ContactProfile = {
        id: participant.id,
        canonicalEmail: participant.canonical_email,
        displayName: participant.display_name,
        emailAddresses: participant.email_addresses || [],
        domain: participant.domain,
        isInternal: participant.is_internal,
        relationshipType: participant.relationship_type,
        importanceWeight: participant.importance_weight || 1.0,
        firstSeenAt: new Date(participant.first_seen_at),
        lastSeenAt: new Date(participant.last_seen_at),
      };
      
      this.canonicalToProfile.set(profile.canonicalEmail, profile);
      
      // Map all email addresses to canonical
      for (const email of profile.emailAddresses) {
        this.emailToCanonical.set(email.toLowerCase(), profile.canonicalEmail);
      }
    }
    
    console.log(`✅ Loaded ${this.canonicalToProfile.size} existing contacts`);
  }
  
  /**
   * Add or update a contact
   */
  addContact(email: string, name?: string): string {
    const normalizedEmail = this.normalizeEmail(email);
    
    // Check if email already maps to a canonical contact
    if (this.emailToCanonical.has(normalizedEmail)) {
      const canonical = this.emailToCanonical.get(normalizedEmail)!;
      const profile = this.canonicalToProfile.get(canonical)!;
      
      // Update last seen
      profile.lastSeenAt = new Date();
      
      // Update display name if provided and not already set
      if (name && !profile.displayName) {
        profile.displayName = name;
      }
      
      return canonical;
    }
    
    // Check if this email is a variation of an existing contact
    const canonical = this.findCanonicalEmail(normalizedEmail);
    
    if (canonical) {
      // Link this email to existing contact
      const profile = this.canonicalToProfile.get(canonical)!;
      profile.emailAddresses.push(normalizedEmail);
      profile.lastSeenAt = new Date();
      this.emailToCanonical.set(normalizedEmail, canonical);
      
      return canonical;
    }
    
    // Create new contact
    const domain = this.extractDomain(normalizedEmail);
    const userDomain = this.extractDomain(this.userEmail);
    
    const newProfile: ContactProfile = {
      canonicalEmail: normalizedEmail,
      displayName: name || this.extractNameFromEmail(normalizedEmail),
      emailAddresses: [normalizedEmail],
      domain,
      isInternal: domain === userDomain,
      relationshipType: 'other',
      importanceWeight: 1.0,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    };
    
    this.canonicalToProfile.set(normalizedEmail, newProfile);
    this.emailToCanonical.set(normalizedEmail, normalizedEmail);
    
    return normalizedEmail;
  }
  
  /**
   * Get canonical email for any email address
   */
  getCanonicalEmail(email: string): string {
    const normalized = this.normalizeEmail(email);
    return this.emailToCanonical.get(normalized) || normalized;
  }
  
  /**
   * Get contact profile
   */
  getContactProfile(email: string): ContactProfile | undefined {
    const canonical = this.getCanonicalEmail(email);
    return this.canonicalToProfile.get(canonical);
  }
  
  /**
   * Get all contacts
   */
  getAllContacts(): ContactProfile[] {
    return Array.from(this.canonicalToProfile.values());
  }
  
  /**
   * Normalize email address
   */
  private normalizeEmail(email: string): string {
    // Extract email from "Name <email>" format
    const match = email.match(/<(.+?)>/);
    if (match) {
      email = match[1];
    }
    
    return email.trim().toLowerCase();
  }
  
  /**
   * Extract domain from email
   */
  private extractDomain(email: string): string {
    const normalized = this.normalizeEmail(email);
    const parts = normalized.split('@');
    return parts.length > 1 ? parts[1] : '';
  }
  
  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    const normalized = this.normalizeEmail(email);
    const localPart = normalized.split('@')[0];
    
    // Convert john.doe or john_doe to John Doe
    const name = localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return name;
  }
  
  /**
   * Find canonical email for a variation
   * Checks if this email is a variation of an existing contact
   */
  private findCanonicalEmail(email: string): string | null {
    const domain = this.extractDomain(email);
    const localPart = email.split('@')[0];
    
    // Check for same domain variations
    for (const [existingEmail, canonical] of this.emailToCanonical.entries()) {
      const existingDomain = this.extractDomain(existingEmail);
      const existingLocalPart = existingEmail.split('@')[0];
      
      // Same domain required
      if (existingDomain !== domain) {
        continue;
      }
      
      // Check if local parts are similar
      if (this.areLocalPartsSimilar(localPart, existingLocalPart)) {
        return canonical;
      }
    }
    
    return null;
  }
  
  /**
   * Check if two email local parts are similar
   * Examples:
   * - john.doe and john → similar
   * - john.doe and jdoe → similar
   * - john.doe and jane.doe → not similar
   */
  private areLocalPartsSimilar(a: string, b: string): boolean {
    // Remove dots, underscores, dashes
    const cleanA = a.replace(/[._-]/g, '').toLowerCase();
    const cleanB = b.replace(/[._-]/g, '').toLowerCase();
    
    // Exact match after cleaning
    if (cleanA === cleanB) {
      return true;
    }
    
    // Check if one is a substring of the other (for john vs john.doe)
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
      return true;
    }
    
    // Check for initials (john.doe vs jdoe)
    const initialsA = a.split(/[._-]/).map(p => p[0]).join('');
    const initialsB = b.split(/[._-]/).map(p => p[0]).join('');
    
    if (cleanA === initialsB || cleanB === initialsA) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Set relationship type for a contact
   */
  setRelationshipType(
    email: string,
    type: ContactProfile['relationshipType']
  ): void {
    const canonical = this.getCanonicalEmail(email);
    const profile = this.canonicalToProfile.get(canonical);
    
    if (profile) {
      profile.relationshipType = type;
    }
  }
  
  /**
   * Set importance weight for a contact
   */
  setImportanceWeight(email: string, weight: number): void {
    const canonical = this.getCanonicalEmail(email);
    const profile = this.canonicalToProfile.get(canonical);
    
    if (profile) {
      profile.importanceWeight = weight;
    }
  }
  
  /**
   * Save all contacts to database
   */
  async saveContacts(userId: string): Promise<void> {
    console.log(`💾 Saving ${this.canonicalToProfile.size} contacts...`);
    
    const contacts = Array.from(this.canonicalToProfile.values());
    
    for (const contact of contacts) {
      const { error } = await this.supabase
        .from('participants')
        .upsert({
          id: contact.id,
          user_id: userId,
          canonical_email: contact.canonicalEmail,
          display_name: contact.displayName,
          email_addresses: contact.emailAddresses,
          domain: contact.domain,
          is_internal: contact.isInternal,
          relationship_type: contact.relationshipType,
          importance_weight: contact.importanceWeight,
          first_seen_at: contact.firstSeenAt.toISOString(),
          last_seen_at: contact.lastSeenAt.toISOString(),
        });
      
      if (error) {
        console.error(`❌ Error saving contact ${contact.canonicalEmail}:`, error);
      }
    }
    
    console.log('✅ Contacts saved successfully');
  }
  
  /**
   * Get contacts by relationship type
   */
  getContactsByRelationship(
    type: ContactProfile['relationshipType']
  ): ContactProfile[] {
    return Array.from(this.canonicalToProfile.values()).filter(
      c => c.relationshipType === type
    );
  }
  
  /**
   * Get internal contacts (same domain as user)
   */
  getInternalContacts(): ContactProfile[] {
    return Array.from(this.canonicalToProfile.values()).filter(
      c => c.isInternal
    );
  }
  
  /**
   * Get external contacts
   */
  getExternalContacts(): ContactProfile[] {
    return Array.from(this.canonicalToProfile.values()).filter(
      c => !c.isInternal
    );
  }
  
  /**
   * Get top contacts by interaction frequency
   * (This requires interaction data from elsewhere)
   */
  getTopContacts(limit: number = 10): ContactProfile[] {
    return Array.from(this.canonicalToProfile.values())
      .sort((a, b) => b.importanceWeight - a.importanceWeight)
      .slice(0, limit);
  }
}

/**
 * Helper function to extract email and name from various formats
 */
export function parseEmailAddress(emailString: string): {
  email: string;
  name?: string;
} {
  // Format: "John Doe <john@example.com>"
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/);
  
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim().toLowerCase(),
    };
  }
  
  // Format: "john@example.com"
  return {
    email: emailString.trim().toLowerCase(),
  };
}
