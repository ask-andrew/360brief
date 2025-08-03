# Standard Daily Brief

## Subject
Your 360Brief • {{date}}

## Body
```
[Logo] 360BRIEF

Good {{time_of_day}} {{user_first_name}},

Here's your executive summary for {{date}}:

{{#if priority_items}}
🚨 PRIORITY ITEMS ({{priority_items.length}})
{{#each priority_items}}
• {{this}}
{{/each}}
{{/if}}

{{#if project_updates}}
📊 PROJECT UPDATES
{{#each project_updates}}
• {{this.name}}: {{this.progress}}% complete {{#if this.status}}({{this.status}}){{/if}}
{{/each}}
{{/if}}

{{#if schedule}}
⏰ TODAY'S SCHEDULE
{{#each schedule}}
• {{this.time}} - {{this.title}}{{#if this.location}} ({{this.location}}){{/if}}
{{/each}}
{{/if}}

{{#if action_items}}
✅ ACTION ITEMS ({{action_items.length}})
{{#each action_items}}
• {{this}}
{{/each}}
{{/if}}

[View Full Dashboard] [Reply to Brief] [Snooze]
```

## Variables
- `{{date}}`: Current date in user's preferred format
- `{{time_of_day}}`: Morning/Afternoon/Evening based on time
- `{{user_first_name}}`: User's first name
- `{{priority_items}}`: Array of priority items
- `{{project_updates}}`: Array of project updates with name, progress, and status
- `{{schedule}}`: Array of calendar events with time, title, and location
- `{{action_items}}`: Array of action items
