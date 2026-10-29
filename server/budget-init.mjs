import {initializeBudget} from './budget.mjs';
import {callLimit} from './config.mjs';
// Operator-only initialization. Exclusive creation refuses existing state.
initializeBudget(process.env.META_BUDGET_FILE,callLimit(process.env.META_MAX_CALLS));
console.log('Budget initialized. Preserve this state across restarts.');
