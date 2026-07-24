import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';

import dashboard from './routes/dashboard';
import visits from './routes/visits';
import patients from './routes/patients';
import doctors from './routes/doctors';
import whatsapp from './routes/whatsapp';
import auth from './routes/auth';

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

app.route('/api/dashboard/summary', dashboard);
app.route('/api/visits', visits);
app.route('/api/patients', patients);
app.route('/api/doctors', doctors);
app.route('/api/settings/whatsapp', whatsapp);
app.route('/api/auth', auth);

app.get('/', (c) => c.text('puri-cinere-worker is running'));

export default app;
