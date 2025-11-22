import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ⚡ ULTRA-OPTIMIZED CLUSTER LOAD BALANCER
 * 
 * Features:
 * - Multi-core CPU utilization
 * - Automatic worker process management
 * - Zero-downtime restarts
 * - Health monitoring
 * - Graceful shutdown
 * - Worker failure recovery
 */

const numCPUs = os.cpus().length;
const WORKER_COUNT = process.env.WORKER_COUNT 
  ? parseInt(process.env.WORKER_COUNT, 10) 
  : Math.max(2, Math.min(numCPUs - 1, 4)); // Use 2-4 workers, leave 1 CPU for system

// ⚡ Worker health tracking
const workers = new Map();
let restartCount = 0;
const MAX_RESTARTS = 10;
const RESTART_WINDOW = 60000; // 1 minute

// ⚡ Worker restart tracking (for circuit breaker)
const restartTimes = [];

/**
 * ⚡ Create and manage a worker process
 */
function spawnWorker() {
  // ⚡ Fork worker - in ES modules, cluster.fork() runs the same file (cluster.js)
  // The worker branch will import and run server.js
  const worker = cluster.fork();
  
  workers.set(worker.id, {
    pid: worker.process.pid,
    id: worker.id,
    spawnedAt: Date.now(),
    restarts: 0,
    lastRestart: 0,
    status: 'starting',
  });
  
  console.log(`⚡ Worker ${worker.id} (PID: ${worker.process.pid}) spawned`);
  
  // ⚡ Worker message handler
  worker.on('message', (message) => {
    if (message.type === 'status') {
      const workerInfo = workers.get(worker.id);
      if (workerInfo) {
        workerInfo.status = message.status;
      }
    }
  });
  
  // ⚡ Worker error handler
  worker.on('error', (error) => {
    console.error(`❌ Worker ${worker.id} error:`, error.message);
  });
  
  // ⚡ Worker exit handler with automatic restart
  worker.on('exit', (code, signal) => {
    const workerInfo = workers.get(worker.id);
    
    if (workerInfo) {
      workerInfo.status = 'dead';
      workerInfo.restarts += 1;
      workerInfo.lastRestart = Date.now();
    }
    
    // ⚡ Check restart rate limit (circuit breaker)
    const now = Date.now();
    restartTimes.push(now);
    
    // Clean old restart times (outside window)
    const recentRestarts = restartTimes.filter(time => now - time < RESTART_WINDOW);
    restartTimes.length = 0;
    restartTimes.push(...recentRestarts);
    
    // ⚡ Circuit breaker: Stop restarting if too many failures
    if (recentRestarts.length > MAX_RESTARTS) {
      console.error(`🚨 Too many worker restarts (${recentRestarts.length}) in ${RESTART_WINDOW}ms. Stopping cluster.`);
      cluster.disconnect();
      process.exit(1);
      return;
    }
    
    // ⚡ Log worker exit
    if (signal) {
      console.log(`⚠️ Worker ${worker.id} was killed by signal: ${signal}`);
    } else if (code !== 0) {
      console.log(`⚠️ Worker ${worker.id} exited with error code: ${code}`);
    } else {
      console.log(`✅ Worker ${worker.id} exited gracefully`);
      return; // Don't restart if graceful exit
    }
    
    // ⚡ Automatic restart with exponential backoff
    if (workerInfo && workerInfo.restarts < MAX_RESTARTS) {
      const backoffDelay = Math.min(1000 * Math.pow(2, workerInfo.restarts), 10000);
      console.log(`🔄 Restarting worker ${worker.id} in ${backoffDelay}ms (restart #${workerInfo.restarts})...`);
      
      setTimeout(() => {
        if (cluster.isPrimary) {
          spawnWorker();
        }
      }, backoffDelay);
    } else {
      console.error(`❌ Worker ${worker.id} exceeded max restarts (${MAX_RESTARTS}). Not restarting.`);
    }
    
    workers.delete(worker.id);
  });
  
  return worker;
}

/**
 * ⚡ Primary process - manages workers
 */
if (cluster.isPrimary) {
  console.log(`⚡ Primary process (PID: ${process.pid}) starting...`);
  console.log(`⚡ CPU cores available: ${numCPUs}`);
  console.log(`⚡ Creating ${WORKER_COUNT} worker processes...`);
  
  // ⚡ Spawn initial workers
  for (let i = 0; i < WORKER_COUNT; i++) {
    spawnWorker();
  }
  
  // ⚡ Health monitoring interval
  setInterval(() => {
    const aliveWorkers = Array.from(workers.values()).filter(w => w.status === 'alive').length;
    const totalWorkers = workers.size;
    
    if (totalWorkers < WORKER_COUNT) {
      console.log(`⚠️ Worker count below target (${totalWorkers}/${WORKER_COUNT}). Spawning new workers...`);
      const needed = WORKER_COUNT - totalWorkers;
      for (let i = 0; i < needed; i++) {
        spawnWorker();
      }
    }
    
    // Log stats every 5 minutes (20 intervals × 15s = 5 minutes)
    if (restartCount % 20 === 0 && restartCount > 0) {
      console.log(`📊 Cluster Stats: ${aliveWorkers}/${totalWorkers} workers alive, ${numCPUs} CPU cores`);
    }
    restartCount++;
  }, 15000); // Check every 15 seconds
  
  // ⚡ Graceful shutdown handler
  const gracefulShutdown = (signal) => {
    console.log(`\n⚡ Received ${signal}. Gracefully shutting down cluster...`);
    
    const workerIds = Array.from(workers.keys());
    let shutdownCount = 0;
    
    // Disconnect all workers
    for (const workerId of workerIds) {
      const worker = cluster.workers[workerId];
      if (worker) {
        worker.disconnect();
        shutdownCount++;
      }
    }
    
    console.log(`⚡ Disconnected ${shutdownCount} workers. Waiting for them to exit...`);
    
    // Wait for all workers to exit (max 30 seconds)
    const checkInterval = setInterval(() => {
      if (Object.keys(cluster.workers).length === 0) {
        clearInterval(checkInterval);
        console.log('✅ All workers exited. Shutting down primary process.');
        process.exit(0);
      }
    }, 1000);
    
    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('❌ Force exit after timeout');
      process.exit(1);
    }, 30000);
  };
  
  // ⚡ Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // ⚡ Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Primary process uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  // ⚡ Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Primary process unhandled rejection:', reason);
  });
  
  console.log(`✅ Primary process ready. Managing ${WORKER_COUNT} workers.`);
  
} else {
  // ⚡ Worker process - start the actual server
  const workerId = cluster.worker?.id || 'unknown';
  const workerPid = process.pid;
  
  console.log(`⚡ Worker ${workerId} (PID: ${workerPid}) starting server...`);
  
  // ⚡ Set worker ID environment variable
  process.env.WORKER_ID = workerId.toString();
  
  // ⚡ Import and run the server (server.js handles the rest)
  // Use relative import for ES modules (works correctly)
  import('./server.js')
    .then((serverModule) => {
      // Send status update to primary
      if (cluster.worker) {
        cluster.worker.send({ type: 'status', status: 'alive', workerId, pid: workerPid });
      }
      console.log(`✅ Worker ${workerId} (PID: ${workerPid}) server started successfully`);
    })
    .catch((error) => {
      console.error(`❌ Worker ${workerId} failed to start server:`, error.message || error);
      process.exit(1);
    });
  
  // ⚡ Worker error handlers
  process.on('uncaughtException', (error) => {
    console.error(`❌ Worker ${workerId} uncaught exception:`, error.message || error);
    // Let the worker die, primary will restart it
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error(`❌ Worker ${workerId} unhandled rejection:`, reason);
  });
  
  // ⚡ Worker status reporting
  setInterval(() => {
    if (cluster.worker) {
      cluster.worker.send({ 
        type: 'status', 
        status: 'alive', 
        workerId, 
        pid: workerPid,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    }
  }, 30000); // Report status every 30 seconds
}

