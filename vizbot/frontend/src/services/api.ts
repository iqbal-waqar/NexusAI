import axios from 'axios';
import { AppAnalysisData, DbConnectionDetails } from '../types';

const API_URL = 'http://localhost:8000/api';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const analyzeCsv = async (file: File): Promise<AppAnalysisData> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    // Unwrap the backend response
    // Backend returns: { narrative_summary: "...", analysis_results: { ... } }
    const { narrative_summary, analysis_results } = response.data;

    return {
        narrative_summary,
        ...analysis_results
    };
};

export const analyzeDatabase = async (details: DbConnectionDetails): Promise<AppAnalysisData> => {
    const payload: Record<string, unknown> = {
        db_type: details.db_type,
    };

    if (details.db_type === 'postgresql') {
        payload.postgresql_config = {
            host: details.host,
            port: details.port,
            database: details.database,
            username: details.username,
            password: details.password
        };
    } else if (details.db_type === 'mongodb') {
        payload.mongodb_config = {
            connection_uri: details.connection_uri,
            database: details.database
        };
    }

    const response = await axios.post(`${API_URL}/database/analyze`, payload);
    const data = response.data;

    // Default structure to prevent crashes
    const result: AppAnalysisData = {
        narrative_summary: data.narrative_summary || "Analysis complete.",
        basic_stats: {
            shape: { rows: 0, columns: 0 },
            columns: [],
            dtypes: {},
            missing_values: {},
            missing_percentage: {},
            duplicates: 0,
            memory_usage: 0,
            numerical_columns: [],
            categorical_columns: [],
            datetime_columns: [],
            numerical_stats: {},
            categorical_stats: {}
        },
        outliers: {},
        correlations: { correlation_matrix: {}, strong_correlations: [] },
        visualizations: {}
    };

    // Adapt the multi-table response to the single-view dashboard
    // We pick the first table/collection analyzed
    const tables = data.analysis_results?.table_analyses || [];

    if (tables.length > 0) {
        const mainTable = tables[0];
        const tableName = mainTable.table_name || mainTable.collection_name;

        // 1. Map stats
        if (mainTable.stats) {
            result.basic_stats = mainTable.stats;
        }

        // 2. Map visualizations for this table
        // Backend returns visualizations keyed by table name: { "users": { "univariate": [], ... } }
        if (data.visualizations && data.visualizations[tableName]) {
            result.visualizations = data.visualizations[tableName];
        }

        // 3. Update narrative to mention which table is shown
    }

    return result;
};

export const chatWithCsv = async (message: string, history: ChatMessage[]) => {
    const response = await axios.post(`${API_URL}/chat`, {
        message,
        history
    });
    return response.data;
};
