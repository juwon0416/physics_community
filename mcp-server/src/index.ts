import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { FIELD_IDS, MCP_SERVER_NAME, MCP_SERVER_VERSION } from './constants.js';
import {
    createConceptNode,
    createOrUpdateSection,
    createOrUpdateTopic,
    deleteGraphEdge,
    getGraphSnapshot,
    getSectionsByTopic,
    getTopicBySlug,
    listTopics,
    upsertGraphEdge,
    writeTopicDraft,
} from './repository.js';

const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
});

server.registerTool(
    'list_topics',
    {
        title: 'List topics',
        description: 'List timeline topics, optionally narrowed to one physics field.',
        inputSchema: {
            fieldId: z.enum(FIELD_IDS).optional(),
        },
    },
    async ({ fieldId }) => {
        const topics = await listTopics(fieldId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(topics, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'get_topic',
    {
        title: 'Get topic',
        description: 'Load a topic by slug together with its ordered sections.',
        inputSchema: {
            slug: z.string().min(1),
        },
    },
    async ({ slug }) => {
        const topic = await getTopicBySlug(slug);
        if (!topic) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Topic not found: ${slug}`,
                    },
                ],
            };
        }

        const sections = await getSectionsByTopic(topic.id);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ topic, sections }, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'upsert_topic',
    {
        title: 'Create or update topic',
        description: 'Create a new topic or update an existing one, and keep the graph topic node in sync.',
        inputSchema: {
            id: z.string().uuid().optional(),
            field_id: z.enum(FIELD_IDS),
            year: z.string().optional(),
            title: z.string().min(1),
            slug: z.string().optional(),
            summary: z.string().optional(),
            tags: z.array(z.string()).optional(),
            content: z.string().optional(),
            image_url: z.string().optional(),
            pdf_url: z.string().optional(),
        },
    },
    async (input) => {
        const topic = await createOrUpdateTopic(input);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(topic, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'write_topic_draft',
    {
        title: 'Write topic draft',
        description: 'Append to or replace the editor content of an existing topic.',
        inputSchema: {
            slug: z.string().min(1),
            mode: z.enum(['append', 'replace']).default('append'),
            content: z.string().min(1),
            summary: z.string().optional(),
        },
    },
    async ({ slug, mode, content, summary }) => {
        const topic = await writeTopicDraft({ slug, mode, content, summary });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(topic, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'upsert_section',
    {
        title: 'Create or update section',
        description: 'Create or update a topic section and maintain the topic -> section hierarchy edge.',
        inputSchema: {
            id: z.string().uuid().optional(),
            topic_id: z.string().uuid(),
            title: z.string().min(1),
            content: z.string().min(1),
            content_light: z.string().optional(),
            order_index: z.number().int().nonnegative().optional(),
        },
    },
    async (input) => {
        const section = await createOrUpdateSection(input);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(section, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'create_concept_node',
    {
        title: 'Create concept node',
        description: 'Create a concept node for the graph if it does not already exist.',
        inputSchema: {
            label: z.string().min(1),
            description: z.string().optional(),
            slug: z.string().optional(),
        },
    },
    async ({ label, description, slug }) => {
        const node = await createConceptNode({ label, description, slug });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(node, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'upsert_graph_edge',
    {
        title: 'Create graph edge',
        description: 'Create or keep a graph edge between two nodes.',
        inputSchema: {
            source: z.string().min(1),
            target: z.string().min(1),
            label: z.string().min(1).default('related_to'),
        },
    },
    async ({ source, target, label }) => {
        const edge = await upsertGraphEdge(source, target, label);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(edge, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'delete_graph_edge',
    {
        title: 'Delete graph edge',
        description: 'Delete one exact graph edge.',
        inputSchema: {
            source: z.string().min(1),
            target: z.string().min(1),
            label: z.string().min(1),
        },
    },
    async ({ source, target, label }) => {
        const edge = await deleteGraphEdge(source, target, label);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(edge, null, 2),
                },
            ],
        };
    },
);

server.registerTool(
    'get_graph_snapshot',
    {
        title: 'Get graph snapshot',
        description: 'Return the raw graph_nodes and graph_edges tables for AI-assisted graph management.',
        inputSchema: {},
    },
    async () => {
        const snapshot = await getGraphSnapshot();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(snapshot, null, 2),
                },
            ],
        };
    },
);

server.registerResource(
    'graph-overview',
    'physics://graph/overview',
    {
        title: 'Graph overview',
        description: 'Raw graph snapshot for the physics knowledge graph.',
        mimeType: 'application/json',
    },
    async () => {
        const snapshot = await getGraphSnapshot();
        return {
            contents: [
                {
                    uri: 'physics://graph/overview',
                    mimeType: 'application/json',
                    text: JSON.stringify(snapshot, null, 2),
                },
            ],
        };
    },
);

server.registerPrompt(
    'author_topic',
    {
        title: 'Author topic',
        description: 'Prompt template for expanding a topic page and keeping graph structure in sync.',
        argsSchema: {
            slug: z.string(),
            writingGoal: z.string(),
        },
    },
    ({ slug, writingGoal }) => ({
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text:
                        `Open the topic "${slug}", review its current content and sections, then help author the page for this goal: ${writingGoal}. ` +
                        'Follow the repository guideline in docs/reference/topic_authoring_guidelines.md. ' +
                        'If you introduce major new concepts, create or connect graph nodes as needed.',
                },
            },
        ],
    }),
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${MCP_SERVER_NAME} MCP server connected over stdio`);
}

main().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
