import mjml2html from 'mjml';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);

// Register custom helpers
handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

type TemplateData = {
  [key: string]: any;
};

export class EmailTemplateRenderer {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templateDir: string;

  constructor() {
    this.templateDir = path.join(process.cwd(), 'src/templates');
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.templateDir, templatePath);
      console.log(`Loading template from: ${fullPath}`);
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to load template ${templatePath}:`, error);
      throw new Error(`Failed to load template: ${templatePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load the base layout
    const layoutContent = await this.loadTemplate('base/layout.mjml');
    
    // Load the template content
    const templateContent = await this.loadTemplate(templateName);
    
    // Replace the content placeholder in the layout with the template content
    const fullTemplate = layoutContent.replace('{{{content}}}', templateContent);
    
    // Register a simple helper for @partial-block
    if (!handlebars.helpers['partial-block']) {
      handlebars.registerHelper('partial-block', function(this: any, options: Handlebars.HelperOptions) {
        return options.fn && options.fn(this);
      });
    }
    
    const template = handlebars.compile(fullTemplate, {
      noEscape: true, // Don't escape HTML in MJML
      preventIndent: true, // Preserve indentation for MJML
      strict: false // Be more lenient with missing variables
    });
    
    this.templateCache.set(templateName, template);
    return template;
  }

  private async renderMjml(templateName: string, data: TemplateData): Promise<string> {
    try {
      console.log(`Rendering template: ${templateName}`);
      const template = await this.getTemplate(templateName);
      
      const templateData = {
        ...data,
        year: new Date().getFullYear(),
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/email-preferences`,
        preferencesUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
      };
      
      console.log('Template data:', JSON.stringify(templateData, null, 2));
      
      const mjmlContent = template(templateData);
      console.log('Generated MJML content:', mjmlContent.substring(0, 200) + '...');

      const mjmlOptions = {
        filePath: path.join(this.templateDir, path.dirname(templateName)),
        minify: true,
        validationLevel: 'strict' as const,
      };
      
      console.log('MJML options:', mjmlOptions);
      
      const { html, errors } = mjml2html(mjmlContent, mjmlOptions);

      if (errors && errors.length > 0) {
        console.error('MJML Errors:', errors);
        throw new Error(`MJML Errors: ${JSON.stringify(errors, null, 2)}`);
      }
      
        return html;
    } catch (error) {
      console.error('Error in renderMjml:', error);
      throw new Error(`Failed to render MJML template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async renderMissionBriefEmail(data: {
    style: 'concise' | 'detailed';
    subject: string;
    situation: any;
    action: any;
    impact?: any;
    updates?: any[];
    cta: { text: string; url: string };
    secondaryCta?: { text: string; url: string };
  }): Promise<string> {
    try {
      console.log(`Rendering Mission Brief email (${data.style} version)`);
      const templateName = `styles/mission-brief/${data.style}.mjml`;
      console.log(`Using template: ${templateName}`);
      
      const templatePath = path.join(this.templateDir, templateName);
      console.log(`Full template path: ${templatePath}`);
      
      // Verify template exists
      try {
        await fs.promises.access(templatePath, fs.constants.F_OK);
        console.log('Template file exists');
      } catch (error) {
        console.error(`Template file does not exist: ${templatePath}`);
        throw new Error(`Template file not found: ${templateName}`);
      }
      
      const result = await this.renderMjml(templateName, {
        ...data,
        subject: data.subject,
      });
      
      console.log('Successfully rendered email template');
      return result;
    } catch (error) {
      console.error('Error in renderMissionBriefEmail:', error);
      throw error;
    }
  }
}

// Singleton instance
export const emailTemplateRenderer = new EmailTemplateRenderer();
