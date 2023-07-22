"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsDirName = exports.getEnv = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const pg_1 = require("pg");
const typeorm_1 = require("typeorm");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const postgres_migrations_1 = require("postgres-migrations");
const yaml_1 = require("yaml");
const class_validator_1 = require("class-validator");
const nodemailer_1 = __importDefault(require("nodemailer"));
const express_status_monitor_1 = __importDefault(require("express-status-monitor"));
const io_1 = __importDefault(require("@pm2/io"));
const util_1 = require("../common/util");
const token_1 = __importDefault(require("./models/token"));
const requestLog_1 = __importDefault(require("./models/requestLog"));
const smtpConfig_1 = __importDefault(require("./lib/smtpConfig"));
const webpack_config_1 = __importDefault(require("../../webpack.config"));
const routeCreation_1 = require("./lib/routeCreation");
const logger_1 = require("./lib/logger");
const crypto_1 = require("./lib/crypto");
const authMiddleware_1 = __importDefault(require("./lib/authMiddleware"));
const participantMiddleware_1 = __importDefault(require("./lib/participantMiddleware"));
const updateCounters_1 = __importDefault(require("./lib/updateCounters"));
const databaseLogger_1 = __importDefault(require("./lib/databaseLogger"));
const clientRoutes_1 = require("../common/clientRoutes");
const serverRoutes_1 = require("./serverRoutes");
const register_1 = __importDefault(require("./api/register"));
const verifyEmail_1 = __importDefault(require("./api/verifyEmail"));
const login_1 = __importDefault(require("./api/login"));
const createApiToken_1 = __importDefault(require("./api/createApiToken"));
const deleteApiToken_1 = __importDefault(require("./api/deleteApiToken"));
const getApiTokens_1 = __importDefault(require("./api/getApiTokens"));
const authTest_1 = __importDefault(require("./api/authTest"));
const uploadParticipants_1 = __importDefault(require("./api/uploadParticipants"));
const getParticipants_1 = __importDefault(require("./api/getParticipants"));
const getParticipantOverview_1 = __importDefault(require("./api/getParticipantOverview"));
const getEventOverviews_1 = __importDefault(require("./api/getEventOverviews"));
const getExperimentConfig_1 = __importDefault(require("./api/getExperimentConfig"));
const postExperimentConfig_1 = __importDefault(require("./api/postExperimentConfig"));
const getExperimentConfigHistory_1 = __importDefault(require("./api/getExperimentConfigHistory"));
const checkParticipantCode_1 = __importDefault(require("./api/checkParticipantCode"));
const createSession_1 = __importDefault(require("./api/createSession"));
const participantConfig_1 = __importDefault(require("./api/participantConfig"));
const postEvent_1 = __importDefault(require("./api/postEvent"));
const getEvents_1 = __importDefault(require("./api/getEvents"));
const createParticipant_1 = __importDefault(require("./api-2/createParticipant"));
const updateParticipant_1 = __importDefault(require("./api-2/updateParticipant"));
const getActivityReport_1 = __importDefault(require("./api-2/getActivityReport"));
const createTransitionSetting_1 = __importDefault(require("./api-2/createTransitionSetting"));
const getTransitionSetting_1 = __importDefault(require("./api-2/getTransitionSetting"));
const monitoring_1 = __importDefault(require("./api-2/monitoring"));
const participantsReport_1 = __importDefault(require("./api-2/participantsReport"));
const getYouTubeConfig_1 = __importDefault(require("./lib/config-loader/getYouTubeConfig"));
const youTubeApi_1 = __importDefault(require("./lib/youTubeApi"));
const scrapeYouTube_1 = __importDefault(require("./lib/scrapeYouTube"));
// DO NOT FORGET TO UPDATE THIS FILE WHEN ADDING NEW ENTITIES
const entities_1 = __importDefault(require("./entities"));
const loadConfigYamlRaw_1 = require("./lib/config-loader/loadConfigYamlRaw");
const loadDbConfig_1 = require("./lib/config-loader/loadDbConfig");
const externalNotifier_1 = __importDefault(require("./lib/externalNotifier"));
const email_1 = require("./lib/email");
const getEnv = () => {
    const env = process.env.NODE_ENV;
    if (env !== 'production' && env !== 'development') {
        throw new Error('NODE_ENV must be set explicitly to either "production" or "development"');
    }
    return env;
};
exports.getEnv = getEnv;
const env = (0, exports.getEnv)();
const upload = (0, multer_1.default)();
const currentRequests = io_1.default.counter({
    name: 'Realtime request count',
    id: 'app/realtime/request',
});
const slowQueries = io_1.default.meter({
    name: 'Slow queries',
    id: 'app/realtime/slowQueries',
});
exports.logsDirName = 'logs';
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const root = yield (0, util_1.findPackageJsonDir)(__dirname);
    const logsPath = (0, path_1.join)(root, exports.logsDirName, 'server.log');
    const logStream = (0, fs_1.createWriteStream)(logsPath, { flags: 'a' });
    const config = yield (0, loadConfigYamlRaw_1.loadConfigYamlRaw)();
    const createLogger = (0, logger_1.makeCreateDefaultLogger)(logStream);
    const log = createLogger('<server>');
    const dockerComposeYaml = yield (0, promises_1.readFile)((0, path_1.join)(root, 'docker-compose.yaml'), 'utf-8');
    const dockerComposeConfig = (0, yaml_1.parse)(dockerComposeYaml);
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid config.yml');
    }
    if (!(0, util_1.has)('smtp')(config)) {
        throw new Error('Missing smtp config in config.yml');
    }
    const smtpConfig = new smtpConfig_1.default();
    Object.assign(smtpConfig, config.smtp);
    const smtpConfigErrors = yield (0, class_validator_1.validate)(smtpConfig);
    if (smtpConfigErrors.length > 0) {
        console.error('Invalid smtp config in config.yml', smtpConfigErrors);
        process.exit(1);
    }
    const transport = nodemailer_1.default.createTransport(smtpConfig);
    const mailServiceDependencies = {
        transport,
        from: smtpConfig.auth.user,
        log: createLogger('<mailer>'),
    };
    const mailer = (0, email_1.createMailService)(mailServiceDependencies);
    log('success', 'mailer created');
    if (!dockerComposeConfig || typeof dockerComposeConfig !== 'object') {
        throw new Error('Invalid docker-compose.yaml');
    }
    const portKey = `${env}-server-port`;
    const port = (0, util_1.getInteger)([portKey])(config);
    const dbPortString = (0, util_1.getString)(['services', `${env}-db`, 'ports', '0'])(dockerComposeConfig);
    const [dbHostPort, dbDockerPort] = dbPortString.split(':');
    const dbPort = env === 'development' ? Number(dbHostPort) : Number(dbDockerPort);
    if (!dbPort || !Number.isInteger(dbPort)) {
        throw new Error(`Invalid db port: ${dbPort}`);
    }
    const dbConfig = yield (0, loadDbConfig_1.loadDatabaseConfig)({
        environnement: env,
        useDockerAddress: env === 'production',
    }, root);
    const pgClient = new pg_1.Client(dbConfig);
    try {
        yield pgClient.connect();
    }
    catch (err) {
        console.error('Error connecting to the database with config', dbConfig, ':', err, 'is the db server running?');
        process.exit(1);
    }
    try {
        const migrated = yield (0, postgres_migrations_1.migrate)({ client: pgClient }, (0, path_1.join)(root, 'migrations'));
        log('successfully', 'ran migrations:', migrated);
    }
    catch (err) {
        log('error', 'running migrations:', err);
        process.exit(1);
    }
    yield pgClient.end();
    const ds = new typeorm_1.DataSource(Object.assign(Object.assign({ type: 'postgres' }, dbConfig), { username: dbConfig.user, synchronize: false, entities: entities_1.default, namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(), logging: true, maxQueryExecutionTime: 200, logger: new databaseLogger_1.default(createLogger('<database>'), slowQueries) }));
    try {
        yield ds.initialize();
    }
    catch (err) {
        console.error('Error initializing data source:', err);
        process.exit(1);
    }
    log('Successfully initialized data source');
    try {
        yield (0, updateCounters_1.default)({
            dataSource: ds,
            log: createLogger(0),
        });
    }
    catch (err) {
        log('error', 'updating activity counters:', err);
        process.exit(1);
    }
    const youTubeConfig = (0, getYouTubeConfig_1.default)(config);
    // Not using cache in the scraping process because we're not gonna ask twice for the same video data
    const ytApi = (0, youTubeApi_1.default)('without-cache')(youTubeConfig, createLogger('<yt-api>'), ds);
    (0, scrapeYouTube_1.default)(ds, createLogger('<yt-scraper>'), ytApi)
        .then(() => {
        log('success', 'done scraping youtube metadata');
    })
        .catch(err => {
        log('error', 'scraping youtube metadata:', err);
    });
    const privateKey = yield (0, promises_1.readFile)((0, path_1.join)(root, 'private.key'), 'utf-8');
    const tokenTools = (0, crypto_1.createTokenTools)(privateKey);
    const notifierServices = {
        mailer,
        log: createLogger('<notifier>'),
    };
    const notifier = (0, externalNotifier_1.default)(config)(notifierServices);
    const routeContext = {
        dataSource: ds,
        mailer,
        createLogger,
        tokenTools,
        youTubeConfig,
        notifier,
    };
    transport.sendMail({
        from: smtpConfig.auth.user,
        to: 'fm.de.jouvencel@gmail.com',
        subject: 'YTDPNL server started',
        text: `YTDPNL server started in ${env} mode`,
    }).catch(err => {
        log('error', 'an error occurred while sending a startup email', err);
    });
    const makeHandler = (0, routeCreation_1.makeRouteConnector)(routeContext);
    const tokenRepo = ds.getRepository(token_1.default);
    const authMiddleware = (0, authMiddleware_1.default)({
        tokenRepo,
        tokenTools,
        createLogger,
    });
    const participantMw = (0, participantMiddleware_1.default)(createLogger);
    const app = (0, express_1.default)();
    const staticRouter = express_1.default.Router();
    if (env === 'development') {
        const compiler = (0, webpack_1.default)(webpack_config_1.default);
        if (!webpack_config_1.default.output) {
            throw new Error('Invalid webpack config, missing output path');
        }
        staticRouter.use((0, webpack_dev_middleware_1.default)(compiler));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        staticRouter.use((0, webpack_hot_middleware_1.default)(compiler));
    }
    app.use((0, cors_1.default)());
    staticRouter.use(express_1.default.static((0, path_1.join)(root, 'public')));
    app.use(staticRouter);
    app.use(body_parser_1.default.json());
    let requestId = 0;
    let nCurrentRequests = 0;
    const logRepo = ds.getRepository(requestLog_1.default);
    app.use((req, res, next) => {
        const tStart = Date.now();
        ++requestId;
        ++nCurrentRequests;
        req.requestId = requestId;
        const log = createLogger(req.requestId);
        currentRequests.inc();
        req.requestId = requestId;
        log(req.method, req.url, req.headers);
        req.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
            const tElapsed = Date.now() - tStart;
            log(`\x1b[94m{request #${requestId} ended in ${tElapsed}ms}\x1b[0m`);
            currentRequests.dec();
            --nCurrentRequests;
            const logEntry = new requestLog_1.default();
            logEntry.latencyMs = tElapsed;
            logEntry.requestId = requestId;
            logEntry.verb = req.method;
            logEntry.path = req.path;
            const { sessionUuid } = req.body;
            if (typeof sessionUuid === 'string') {
                logEntry.sessionUuid = sessionUuid;
            }
            logEntry.statusCode = res.statusCode;
            const { type } = req.body;
            if (typeof type === 'string') {
                logEntry.comment.push(`type: ${type}`);
            }
            try {
                const errors = yield (0, util_1.validateNew)(logEntry);
                if (errors.length > 0) {
                    log('error', 'invalid request log entry:', errors);
                }
                else {
                    logRepo.save(logEntry).catch(err => {
                        log('error', 'saving request log:', err);
                    });
                }
            }
            catch (err) {
                log('error', 'saving request log:', err);
            }
        }));
        next();
    });
    const defineAdminRoute = (def) => {
        app[def.verb](def.path, authMiddleware, makeHandler(def));
    };
    app.use((0, express_status_monitor_1.default)({
        path: '/status',
    }));
    defineAdminRoute(createParticipant_1.default);
    defineAdminRoute(getActivityReport_1.default);
    defineAdminRoute(createTransitionSetting_1.default);
    defineAdminRoute(getTransitionSetting_1.default);
    defineAdminRoute(updateParticipant_1.default);
    defineAdminRoute(monitoring_1.default);
    defineAdminRoute(participantsReport_1.default);
    app.post(serverRoutes_1.postRegister, (0, register_1.default)(routeContext));
    app.get(serverRoutes_1.getVerifyEmailToken, (0, verifyEmail_1.default)(routeContext));
    app.post(serverRoutes_1.postLogin, (0, login_1.default)(routeContext));
    app.get(serverRoutes_1.getApiTokens, authMiddleware, (0, getApiTokens_1.default)(routeContext));
    app.post(serverRoutes_1.createApiToken, authMiddleware, (0, createApiToken_1.default)(routeContext));
    app.delete(serverRoutes_1.deleteApiToken, authMiddleware, (0, deleteApiToken_1.default)(routeContext));
    app.get(serverRoutes_1.getAuthTest, authMiddleware, (0, authTest_1.default)(routeContext));
    app.post(serverRoutes_1.postUploadParticipants, authMiddleware, upload.single('participants'), (0, uploadParticipants_1.default)(routeContext));
    app.get(`${serverRoutes_1.getParticipants}/:page?`, authMiddleware, (0, getParticipants_1.default)(routeContext));
    app.get(`${serverRoutes_1.getParticipantOverview}/:code`, authMiddleware, (0, getParticipantOverview_1.default)(routeContext));
    app.get(`${serverRoutes_1.getEventOverviews}/:sessionUuid`, authMiddleware, (0, getEventOverviews_1.default)(routeContext));
    app.get(serverRoutes_1.getExperimentConfig, authMiddleware, (0, getExperimentConfig_1.default)(routeContext));
    app.post(serverRoutes_1.postExperimentConfig, authMiddleware, (0, postExperimentConfig_1.default)(routeContext));
    app.get(serverRoutes_1.getExperimentConfigHistory, authMiddleware, (0, getExperimentConfigHistory_1.default)(routeContext));
    app.get(`${serverRoutes_1.getEvents}/:page?`, authMiddleware, (0, getEvents_1.default)(routeContext));
    app.post(clientRoutes_1.postCheckParticipantCode, (0, checkParticipantCode_1.default)(routeContext));
    app.post(clientRoutes_1.postCreateSession, participantMw, (0, createSession_1.default)(routeContext));
    app.get(clientRoutes_1.getParticipantConfig, participantMw, (0, participantConfig_1.default)(routeContext));
    app.post(clientRoutes_1.postEvent, participantMw, (0, postEvent_1.default)(routeContext));
    app.use((req, res, next) => {
        var _a;
        if (req.method === 'GET' && ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.startsWith('text/html'))) {
            res.sendFile((0, path_1.join)(root, 'public', 'index.html'));
            return;
        }
        next();
    });
    const server = app.listen(port, '0.0.0.0', () => {
        log('info', `server in "${env}" mode listening on port ${port}`);
    });
    process.on('SIGINT', () => {
        log('info', 'received SIGINT, exiting');
        new Promise((resolve, reject) => {
            server.getConnections((err, connections) => {
                if (err) {
                    log('error', 'getting number of open connections', err);
                    reject(err);
                }
                log('info', `closing ${connections} open connections`);
                server.close(() => {
                    log('info', 'server closed');
                    resolve(connections);
                });
            });
        }).then(connections => {
            log('info', 'exiting after closing (according to Express):', connections, 'connections');
            log('info', 'current requests at exit as computed by app:', nCurrentRequests);
            process.exit(0);
        }).catch(err => {
            log('error', 'error while closing server', err);
            process.exit(1);
        });
    });
});
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map