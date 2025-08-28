import mjml2html from 'mjml';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

// Register custom helpers
handlebars.registerHelper('eq', function (a: unknown, b: unknown): boolean {
  return a === b;
});

handlebars.registerHelper('formatDate', function (date: Date | string | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
});

export interface TemplateData {
  [key: string]: unknown;
  year?: number;
  unsubscribeUrl?: string;
}

export interface TemplateOptions {
  theme?: string;
  layout?: string;
  style?: 'concise' | 'detailed' | 'comprehensive';
}

export interface RenderedTemplate {
  html: string;
  text: string;
}

export class EmailTemplateRenderer {
  private readonly templateCache: Map<string, handlebars.TemplateDelegate> = new Map();
  private readonly templateDir: string;
  private readonly defaultTheme = 'mission-brief';
  private readonly defaultLayout = 'default';
  private readonly defaultStyle: 'detailed' = 'detailed';

  constructor() {
    this.templateDir = path.join(process.cwd(), 'src/templates/emails');
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.templateDir, templatePath);
      console.log(`Loading template from: ${fullPath}`);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to load template ${templatePath}:`, error);
      throw new Error(`Failed to load template: ${templatePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getTemplate(templateName: string): handlebars.TemplateDelegate {
    const template = this.templateCache.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found in cache`);
    }
    return template;
  }

  private async renderMjml(
    templateName: string,
    data: TemplateData,
    options: TemplateOptions
  ): Promise<RenderedTemplate> {
    try {
      console.log(`Rendering template: ${templateName}`);
      const template = this.getTemplate(templateName);

      const {
        theme = this.defaultTheme,
        layout = this.defaultLayout,
        style = this.defaultStyle
      } = options;

      // Load the main template
      const templatePath = `themes/${theme}/${templateName}.mjml`;
      const templateContent = await this.loadTemplate(templatePath);

      // Load the layout if specified
      let layoutContent = '';
      if (layout) {
        try {
          const layoutPath = `layouts/${layout}.mjml`;
          layoutContent = await this.loadTemplate(layoutPath);
        } catch (error) {
          console.warn(`Layout ${layout} not found, using template without layout`);
        }
      }

      // Compile the template with data and style
      const compiledTemplate = handlebars.compile(templateContent);
      const renderedContent = compiledTemplate({ ...data, style });

      // Apply layout if available
      const mjmlContent = layoutContent
        ? layoutContent.replace('{{> content}}', renderedContent)
        : renderedContent;

      // Convert MJML to HTML
      const { html, errors } = mjml2html(mjmlContent, {
        validationLevel: 'soft',
        filePath: this.templateDir,
        minify: process.env.NODE_ENV === 'production'
      });

      if (errors?.length > 0) {
        console.error('MJML Errors:', errors);
        throw new Error('Failed to render MJML template');
      }

      // Generate plain text version
      const text = this.generateTextVersion(html);

      return { html, text };
    } catch (error) {
      console.error('Error rendering template:', error);
      throw new Error(
        `Failed to render template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async render(
    templateName: string,
    data: TemplateData = {},
    options: TemplateOptions = {}
  ): Promise<RenderedTemplate> {
    try {
      return await this.renderMjml(templateName, data, options);
    } catch (error) {
      console.error('Error in render:', error);
      throw new Error(
        `Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async renderMissionBriefEmail(data: {
    style: 'concise' | 'detailed' | 'comprehensive';
    subject: string;
    situation: unknown;
    action: unknown;
    impact?: unknown;
    updates?: unknown[];
    cta: { text: string; url: string };
  }): Promise<RenderedTemplate> {
    try {
      const templateName = data.style === 'concise' ? 'mission-brief-concise' : 'mission-brief-detailed';
      
      const templateData = {
        ...data,
        year: new Date().getFullYear(),
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/email-preferences`,
      };

      return await this.render(templateName, templateData, {
        style: data.style,
        theme: 'mission-brief',
        layout: 'default'
      });
    } catch (error) {
      console.error('Error in renderMissionBriefEmail:', error);
      throw new Error(
        `Failed to render mission brief email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateTextVersion(html: string): string {
    // Simple text conversion - can be enhanced with a proper HTML to text library
    return html
      .replace(/<style[^>]*>[\s\S]*<\/style>/g, '') // Remove style tags
      .replace(/<[^>]+>/g, '\n') // Replace HTML tags with newlines
      .replace(/\s*\n\s*/g, '\n') // Normalize whitespace around newlines
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/([^\n])\n([^\n])/g, '$1 $2') // Join lines that were split by HTML
      .trim();
  }
}

// Singleton instance
export const emailTemplateRenderer = new EmailTemplateRenderer();

export default emailTemplateRenderer;
