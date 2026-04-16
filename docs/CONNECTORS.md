# Connectors

> External services and tools connected via the Model Context Protocol (MCP).
> Connectors extend skill capabilities by integrating with your existing tools.

## How Connectors Work

Skills work in two modes:

- **Standalone**: Every skill works without any connectors. You provide context manually (paste text, upload files, describe the situation).
- **Supercharged**: Connect your tools via MCP and skills automatically pull context, push updates, and integrate with your workflow.

## Available Connectors

### Communication
| Connector | Description |
|-----------|-------------|
| slack | Slack messaging, channels, and search |
| gmail | Gmail email access |
| ms365 | Microsoft 365 (Outlook, Teams) |

### Project Management
| Connector | Description |
|-----------|-------------|
| linear | Linear issue tracking |
| asana | Asana project management |
| atlassian | Jira and Confluence |
| notion | Notion pages and databases |
| monday | Monday.com boards |
| clickup | ClickUp tasks and spaces |

### Development
| Connector | Description |
|-----------|-------------|
| github | GitHub repos, PRs, issues |
| pagerduty | PagerDuty incident management |
| datadog | Datadog monitoring and alerts |

### Design
| Connector | Description |
|-----------|-------------|
| figma | Figma designs and components |
| canva | Canva design assets |

### Data & Analytics
| Connector | Description |
|-----------|-------------|
| snowflake | Snowflake data warehouse |
| databricks | Databricks lakehouse |
| bigquery | Google BigQuery |
| hex | Hex notebooks |
| amplitude | Amplitude product analytics |
| amplitude-eu | Amplitude (EU region) |
| pendo | Pendo product analytics |
| definite | Definite analytics |
| supermetrics | Supermetrics marketing data |
| ahrefs | Ahrefs SEO data |
| similarweb | SimilarWeb competitive analytics |

### CRM & Sales
| Connector | Description |
|-----------|-------------|
| hubspot | HubSpot CRM |
| close | Close CRM |
| clay | Clay data enrichment |
| zoominfo | ZoomInfo contact data |
| apollo | Apollo.io prospecting |
| outreach | Outreach.io sequences |
| intercom | Intercom customer messaging |

### Documents & Storage
| Connector | Description |
|-----------|-------------|
| box | Box cloud storage |
| egnyte | Egnyte file management |
| docusign | DocuSign e-signatures |
| pdf | PDF document processing |

### Meetings & Transcription
| Connector | Description |
|-----------|-------------|
| fireflies | Fireflies.ai meeting transcription |

### Calendar
| Connector | Description |
|-----------|-------------|
| google-calendar | Google Calendar |

### Email Marketing
| Connector | Description |
|-----------|-------------|
| klaviyo | Klaviyo email marketing |

## Connector by Plugin

| Plugin | Connectors |
|--------|-----------|
| Engineering | slack, linear, asana, atlassian, notion, github, pagerduty, datadog, google-calendar, gmail |
| Product Management | slack, linear, asana, monday, clickup, atlassian, notion, figma, amplitude, amplitude-eu, pendo, intercom, fireflies, google-calendar, gmail, similarweb |
| Design | slack, figma, linear, asana, atlassian, notion, intercom, google-calendar, gmail |
| PDF Viewer | pdf |
| Data | snowflake, databricks, bigquery, hex, amplitude, amplitude-eu, atlassian, definite |
| Marketing | slack, canva, figma, hubspot, amplitude, amplitude-eu, notion, ahrefs, similarweb, klaviyo, supermetrics, google-calendar, gmail |
| Sales | slack, hubspot, close, clay, zoominfo, notion, atlassian, fireflies, ms365, apollo, outreach, google-calendar, gmail, similarweb |
| Legal | slack, box, egnyte, atlassian, ms365, docusign, google-calendar, gmail |
| Finance | snowflake, databricks, bigquery, slack, ms365, google-calendar, gmail |
| Slack by Salesforce | slack |
| Productivity | slack, notion, asana, linear, atlassian, ms365, monday, clickup, google-calendar, gmail |

## Setting Up Connectors

Connectors are configured through Claude Cowork's MCP integration. Each connector requires authentication with the external service. See your plugin's settings in Claude Cowork to configure available connectors.
