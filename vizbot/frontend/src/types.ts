export interface BasicStats {
    shape: {
        rows: number;
        columns: number;
    };
    columns: string[];
    dtypes: Record<string, string>;
    missing_values: Record<string, number>;
    missing_percentage: Record<string, number>;
    duplicates: number;
    memory_usage: number;
    numerical_columns: string[];
    categorical_columns: string[];
    datetime_columns: string[];
    numerical_stats: Record<string, {
        mean: number | null;
        median: number | null;
        std: number | null;
        min: number | null;
        max: number | null;
        q25: number | null;
        q75: number | null;
        count: number;
        null_count: number;
    }>;
    categorical_stats: Record<string, {
        unique_values: number;
        mode: string | null;
        top_values: Record<string, number>;
        total_count: number;
        null_count: number;
    }>;
}

export interface OutlierInfo {
    count: number;
    percentage: number;
    lower_bound: number;
    upper_bound: number;
    outlier_values: number[];
}

export interface CorrelationInfo {
    correlation_matrix: Record<string, Record<string, number | null>>;
    strong_correlations: Array<{
        variable1: string;
        variable2: string;
        correlation: number;
        strength: string;
    }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlotlyAny = any;

export interface PlotlyChartData {
    chart_type: string;
    column: string;
    second_column?: string;
    plotly_chart: PlotlyAny; // Full Plotly JSON object
}

// Flat dictionary structure: key is chart name, value is Plotly chart object
export interface VisualizationData {
    [key: string]: PlotlyAny; // Plotly chart objects
}

// The raw analysis results from the "analysis_results" key
export interface BackendAnalysisResults {
    basic_stats: BasicStats;
    outliers?: Record<string, OutlierInfo>; // Optional for database analysis
    correlations?: CorrelationInfo; // Optional for database analysis
    visualizations?: VisualizationData; // Optional, only for CSV
}

// The complete object we use in the frontend
export interface AppAnalysisData extends BackendAnalysisResults {
    narrative_summary: string;
}

export interface DbConnectionDetails {
    db_type: 'postgresql' | 'mongodb';
    // PostgreSQL fields
    host?: string;
    port?: number;
    database: string;
    database_name?: string; // Alias sometimes used
    username?: string;
    password?: string;
    // MongoDB field
    connection_uri?: string; // For MongoDB: full connection URI
}

export interface HistoryLogItem {
    id: string;
    type: 'upload' | 'db_connect' | 'chat';
    preview: string;
    timestamp: Date;
}

export type ViewState = 'landing' | 'dashboard';
