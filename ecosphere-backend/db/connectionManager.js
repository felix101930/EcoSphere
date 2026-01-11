// Database Connection Manager
// Manages SQL Server connection pool with sqlcmd fallback
const sql = require('mssql');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { DB_CONFIG, buildSqlcmdCommand, filterOutputLines } = require('../config/database');

class ConnectionManager {
    constructor() {
        this.pool = null;
        this.poolConnected = false;
        this.useFallback = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    /**
     * Initialize connection pool
     * Attempts to create SQL Server connection pool, falls back to sqlcmd if fails
     */
    async initialize() {
        console.log('Initializing database connection...');

        // Try to connect with connection pool
        try {
            await this.connectPool();
            this.poolConnected = true;
            this.useFallback = false;
            console.log('✅ SQL Server connection pool initialized successfully');
            return true;
        } catch (error) {
            console.warn('⚠️  Connection pool failed, using sqlcmd fallback:', error.message);
            this.poolConnected = false;
            this.useFallback = true;

            // Test sqlcmd fallback
            try {
                await this.testSqlcmdConnection();
                console.log('✅ sqlcmd fallback is working');
                return true;
            } catch (sqlcmdError) {
                console.error('❌ Both connection pool and sqlcmd failed');
                throw new Error('Database connection unavailable');
            }
        }
    }

    /**
     * Connect to SQL Server using connection pool
     */
    async connectPool() {
        const config = {
            server: DB_CONFIG.SERVER,
            database: DB_CONFIG.DATABASE,
            options: {
                encrypt: true,
                trustServerCertificate: true,
                enableArithAbort: true,
                connectTimeout: 15000,
                requestTimeout: 30000,
                // Use instance name for SQL Server Express
                instanceName: 'SQLEXPRESS'
            },
            pool: {
                max: 10,
                min: 2,
                idleTimeoutMillis: 30000
            }
        };

        // Use Windows Authentication or SQL Authentication
        if (DB_CONFIG.USER && DB_CONFIG.PASSWORD) {
            config.user = DB_CONFIG.USER;
            config.password = DB_CONFIG.PASSWORD;
            config.options.trustedConnection = false;
        } else {
            config.options.trustedConnection = true;
            // For Windows Authentication with SQL Server Express
            config.authentication = {
                type: 'default'
            };
        }

        this.pool = await sql.connect(config);
        this.connectionAttempts++;
    }

    /**
     * Test sqlcmd connection
     */
    async testSqlcmdConnection() {
        const query = 'SELECT 1 as test';
        const command = buildSqlcmdCommand(query);
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        if (lines.length === 0 || !lines[0].includes('1')) {
            throw new Error('sqlcmd test query failed');
        }
    }

    /**
     * Execute query using connection pool or sqlcmd fallback
     * @param {string} query - SQL query to execute
     * @returns {Promise<Array>} Query results
     */
    async executeQuery(query) {
        if (this.poolConnected && this.pool) {
            try {
                const result = await this.pool.request().query(query);
                return result.recordset;
            } catch (error) {
                console.warn('Pool query failed, falling back to sqlcmd:', error.message);
                this.poolConnected = false;
                this.useFallback = true;
                return await this.executeSqlcmd(query);
            }
        } else {
            return await this.executeSqlcmd(query);
        }
    }

    /**
     * Execute query using sqlcmd
     * @param {string} query - SQL query to execute
     * @returns {Promise<Array>} Query results
     */
    async executeSqlcmd(query) {
        const command = buildSqlcmdCommand(query);
        const { stdout } = await execPromise(command);
        const lines = filterOutputLines(stdout);

        // Parse CSV output into objects
        // This is a simplified parser - services will handle specific parsing
        return lines;
    }

    /**
     * Close connection pool
     */
    async close() {
        if (this.pool) {
            try {
                await this.pool.close();
                console.log('Database connection pool closed');
            } catch (error) {
                console.error('Error closing connection pool:', error.message);
            }
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            poolConnected: this.poolConnected,
            useFallback: this.useFallback,
            connectionAttempts: this.connectionAttempts,
            poolAvailable: this.pool !== null
        };
    }

    /**
     * Retry pool connection
     */
    async retryPoolConnection() {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.log('Max connection attempts reached, staying with sqlcmd fallback');
            return false;
        }

        console.log('Retrying connection pool...');
        try {
            await this.connectPool();
            this.poolConnected = true;
            this.useFallback = false;
            console.log('✅ Connection pool reconnected successfully');
            return true;
        } catch (error) {
            console.warn('⚠️  Retry failed, continuing with sqlcmd fallback');
            return false;
        }
    }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

module.exports = connectionManager;
