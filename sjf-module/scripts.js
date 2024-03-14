// Model
let jobCount = 0; // Initialize job count
let jobs = [];
let currentJob = null; // Track the currently running job
let previousWaitingTimeMap = new Map();
let ioProcessCount = 0; // Initialize I/O process count
let ioProcesses = []; // Array to store I/O processes
let clockIntervalId; // Variable to store the interval ID for the clock update


const clock = () => {
    let time = 0;

    const updateTime = (n) => {
        if (n !== undefined) {
            time = n;
        } else {
            time += 1; // Update time by 1 second per tick
        }
    };

    return {
        getTime: () => time,
        updateTime
    };
};

// Create a single clock instance
const clockModel = clock();

const memoryUsage = () => {
    return Math.floor(Math.random() * 1025); // Generate random number between 0 and 1024 (inclusive)
};

const createJob = () => {
    jobCount++; // Increment job count
    const jobName = `Job${jobCount}`;
    const burstTime = Math.floor(Math.random() * 10) + 1;
    const arrivalTime = clockModel.getTime(); // Get the current time from the clockModel
    const status = 'New';
    const turnAroundTime = '';
    let waitingTime = 0; // Initialize waiting time to 0
    const memoryUsageValue = memoryUsage();

    // Calculate the total burst time of all previously arrived jobs
    // let totalBurstTime = 0;
    // jobs.forEach(job => {
    //     if (job.arrivalTime < arrivalTime) {
    //         totalBurstTime += job.burstTime;
    //     }
    // });

    // Update waiting time for the new job based on the total burst time of previously arrived jobs
    // waitingTime = totalBurstTime;

    const job = {
        name: jobName,
        burstTime: burstTime,
        initialBurstTime: burstTime, // Store initial burst time for terminated jobs
        arrivalTime: arrivalTime,
        status: status,
        turnAroundTime: turnAroundTime,
        waitingTime: waitingTime, // Initialize waiting time to 0
        memoryUsage: memoryUsageValue
    };

    // Add the created job to the jobs array
    jobs.push(job);

    readyJobs(); // Update job statuses
    return job;
};


const readyJobs = () => {
    // Sort the jobs array by burst time
    jobs.sort((a, b) => a.burstTime - b.burstTime);

    // Update job status to 'Ready' if arrival time is less than current time
    jobs.forEach(job => {
        if (job.arrivalTime < clockModel.getTime() && job.status === 'New') {
            job.status = 'Ready';
        }
    });

    // Update the PCB table with updated job statuses
    displayPCBJobs();
};


const cpuBurst = () => {
    // Update I/O processes
    updateIOProcesses();

    // Check if there is a currently running job
    if (currentJob !== null) {
        currentJob.burstTime -= 1;

        // If burst time becomes 0 or negative, change the job status to 'Terminated'
        if (currentJob.burstTime <= 0) {
            currentJob.burstTime = 0; // Ensure burst time is not negative
            currentJob.status = 'Terminated';
            currentJob = null; // Reset the currently running job
        }
    } else {
        // Find the job with the shortest burst time that is ready
        let shortestJob = null;
        jobs.forEach(job => {
            if (job.status === 'Ready') {
                if (shortestJob === null || job.burstTime < shortestJob.burstTime) {
                    shortestJob = job;
                }
            }
        });

        // If a shortest job is found, update its status to 'Running' and set it as the current job
        if (shortestJob !== null) {
            shortestJob.status = 'Running';
            currentJob = shortestJob;
        }
    }

    // Update waiting time for other jobs in 'Ready' status
    jobs.forEach(job => {
        if (job !== currentJob && job.status === 'Ready') {
            job.waitingTime++;
        }
    });

    // Update turn around time for each job until it reaches the burst time
    jobs.forEach(job => {
        if (job.burstTime > 0) {
            job.turnAroundTime++;
        }
    });

    // Update the PCB table with updated job statuses
    displayPCBJobs();
    displayReadyQueue(); // Display ready queue
    // Remove job from ready queue if it's no longer ready
    if (currentJob !== null && currentJob.status !== 'Ready') {
        removeJobFromReadyQueue(currentJob);
    }

    displayTerminateTable();

    // Remove job from PCB if it's terminated
    jobs.forEach(job => {
        if (job.status === 'Terminated') {
            removeJobFromPCB(job);
        }
    });

    // Check if there are any I/O processes, if not start new I/O process
    if (ioProcesses.length === 0) {
        startIOProcess();
    }

    // Display I/O processes
    displayIOProcesses();
};

const startIOProcess = () => {
    // Check if there are any jobs waiting for I/O
    const waitingJobs = jobs.filter(job => job.status === 'Waiting');

    // Select the first waiting job for I/O
    if (waitingJobs.length > 0) {
        const ioJob = waitingJobs[0];
        ioJob.status = 'IORunning';
        ioProcesses.push(ioJob);
    }
}

const updateIOProcesses = () => {
    // Update I/O process statuses
    ioProcesses.forEach(ioProcess => {
        ioProcess.turnAroundTime++;
        if (ioProcess.turnAroundTime >= ioProcess.initialBurstTime) {
            // If I/O process completes, change its status to 'Terminated'
            ioProcess.status = 'Terminated';
        }
    });

    // Remove terminated I/O processes
    ioProcesses = ioProcesses.filter(ioProcess => ioProcess.status !== 'Terminated');
}

// const waitingTimeBurst = () => {
//     let waitingTime = 0;

//     if (currentJob !== null) {
//         currentJob.waitingTime = clockModel.getTime() - currentJob.arrivalTime;
//     }

//     const updateTime = () => {
//         waitingTime += 1;
//     };

//     return {
//         getTime: () => waitingTime,
//         updateTime
//     };
// }

// View
const createTimeElement = (time) => {
    const element = document.createElement('li');
    element.textContent = time;
    return element;
};

const createJobElement = (job) => {
    const jobElement = document.createElement('tr');

    // Create and append table cells for each job property
    const nameCell = document.createElement('td');
    nameCell.textContent = job.name;
    jobElement.appendChild(nameCell);

    const burstTimeCell = document.createElement('td');
    burstTimeCell.textContent = job.burstTime;
    jobElement.appendChild(burstTimeCell);

    const arrivalTimeCell = document.createElement('td');
    arrivalTimeCell.textContent = job.arrivalTime;
    jobElement.appendChild(arrivalTimeCell);

    const waitingTimeCell = document.createElement('td');
    waitingTimeCell.textContent = job.waitingTime;
    jobElement.appendChild(waitingTimeCell);

    const turnAroundTimeCell = document.createElement('td');
    turnAroundTimeCell.textContent = job.turnAroundTime;
    jobElement.appendChild(turnAroundTimeCell);

    const memoryUsageCell = document.createElement('td');
    memoryUsageCell.textContent = job.memoryUsage;
    jobElement.appendChild(memoryUsageCell);

    const statusCell = document.createElement('td');
    statusCell.textContent = job.status;
    jobElement.appendChild(statusCell);

    return jobElement;
};

const createReadyQueueElement = (job) => {
    const readyQueueElement = document.createElement('tr');

    // Create and append table cells for each job property
    const nameCell = document.createElement('td');
    nameCell.textContent = job.name;
    readyQueueElement.appendChild(nameCell);

    const arrivalTimeCell = document.createElement('td');
    arrivalTimeCell.textContent = job.initialBurstTime;
    readyQueueElement.appendChild(arrivalTimeCell);

    const waitingTimeCell = document.createElement('td');
    waitingTimeCell.textContent = job.waitingTime;
    readyQueueElement.appendChild(waitingTimeCell);

    return readyQueueElement; // Return the created row element
};

const createTerminateRow = (job) => {
    const terminateRow = document.createElement('tr');

    // Create and append table cells for each job property
    const nameCell = document.createElement('td');
    nameCell.textContent = job.name;
    terminateRow.appendChild(nameCell);

    const burstTimeCell = document.createElement('td');
    burstTimeCell.textContent = job.initialBurstTime; // Display initial burst time
    terminateRow.appendChild(burstTimeCell);

    const arrivalTimeCell = document.createElement('td');
    arrivalTimeCell.textContent = job.arrivalTime;
    terminateRow.appendChild(arrivalTimeCell);

    const waitingTimeCell = document.createElement('td');
    waitingTimeCell.textContent = job.waitingTime;
    terminateRow.appendChild(waitingTimeCell);

    const turnAroundTimeCell = document.createElement('td');
    turnAroundTimeCell.textContent = job.turnAroundTime;
    terminateRow.appendChild(turnAroundTimeCell);

    const statusCell = document.createElement('td');
    statusCell.textContent = job.status;
    terminateRow.appendChild(statusCell);

    return terminateRow;
};

const createIOElement = (job) => {
    const ioRow = document.createElement('tr');

    // Create and append table cells for each job property
    const nameCell = document.createElement('td');
    nameCell.textContent = job.name;
    ioRow.appendChild(nameCell);

    const runningCell = document.createElement('td');
    runningCell.textContent = job.turnAroundTime;
    ioRow.appendChild(runningCell);

    const responseCell = document.createElement('td');
    responseCell.textContent = job.turnAroundTime;
    ioRow.appendChild(responseCell);

    const statusCell = document.createElement('td');
    statusCell.textContent = job.status;
    ioRow.appendChild(statusCell);

    return ioRow;
};
// Function to clear all table outputs and reset job data
const clearTables = () => {
    // Clear PCB table
    const pcbTable = document.querySelector('.pcb table');
    pcbTable.innerHTML = '<thead><tr><th id="name">Process Name</th><th id="bt">Burst Time</th><th id="at">Arrival Time</th><th id="wt">Waiting Time</th><th id="tt">Turnaround Time</th><th id="mem">Memory Usage</th><th id="status">Status</th></tr></thead>';

    // Clear Ready Queue table
    const readyQueueTable = document.querySelector('.ready-queue table');
    readyQueueTable.innerHTML = '<thead><tr><th id="ready-name">Process Name</th><th id="ready-at">Arrival Time</th><th id="ready-wt">Burst Time</th></tr></thead>';

    // Clear Terminate table
    const terminateTable = document.querySelector('.terminate table');
    terminateTable.innerHTML = '<thead><tr><th id="terminate-name">Process Name</th><th id="terminate-bt">Burst Time</th><th id="terminate-at">Arrival Time</th><th id="terminate-wt">Waiting Time</th><th id="terminate-tt">Turnaround Time</th><th id="terminate-status">Status</th></tr></thead>';

    // Reset the jobs array to an empty array
    jobs = [];
};


// Controller
const displayClock = () => {
    const clockElement = document.getElementById('clock');

    setInterval(() => {
        clockModel.updateTime(); // Update time in the model
        const time = clockModel.getTime();
        const timeElement = createTimeElement(time);

        // Clear previous content and append the new time element
        clockElement.innerHTML = '';
        clockElement.appendChild(timeElement);

        readyJobs(); // Update job statuses
        cpuBurst(); // Update job statuses
    }, 1000);
};

const displayPCBJobs = () => {
    const jobTable = document.querySelector('.pcb table');

    // Clear all rows except the header row
    while (jobTable.rows.length > 1) {
        jobTable.deleteRow(1);
    }

    // Populate the table with updated job information
    jobs.forEach(job => {
        const jobElement = createJobElement(job);
        jobTable.appendChild(jobElement);
    });
};

const displayReadyQueue = () => {
    const readyQueueTable = document.querySelector('.ready-queue table');

    // Clear all rows except the header row
    while (readyQueueTable.rows.length > 1) {
        readyQueueTable.deleteRow(1);
    }

    // Filter the jobs array to get only the jobs with status 'Ready'
    const readyJobs = jobs.filter(job => job.status === 'Ready');

    // Populate the table with updated job information
    readyJobs.forEach(job => {
        const readyQueueElement = createReadyQueueElement(job);
        readyQueueTable.appendChild(readyQueueElement); // Append the row to the table
    });
};

const removeJobFromReadyQueue = (job) => {
    const readyQueueTable = document.querySelector('.ready-queue table');
    const rows = readyQueueTable.rows;

    // Iterate over the rows and remove the row corresponding to the job
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.cells[0].textContent === job.name) {
            readyQueueTable.deleteRow(i);
            break;
        }
    }
};

const removeJobFromPCB = (job) => {
    const pcbTable = document.querySelector('.pcb table'); // Corrected variable name
    const rows = pcbTable.rows;

    // Iterate over the rows and remove the row corresponding to the job
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.cells[0].textContent === job.name) {
            pcbTable.deleteRow(i); // Corrected from readyQueueTable to pcbTable
            break;
        }
    }
};



const displayTerminateTable = () => {
    const terminateTable = document.querySelector('.terminate table');

    // Clear all rows except the header row
    while (terminateTable.rows.length > 1) {
        terminateTable.deleteRow(1);
    }

    // Filter the jobs array to get only the jobs with status 'Terminated'
    const terminatedJobs = jobs.filter(job => job.status === 'Terminated');

    // Populate the table with updated job information
    terminatedJobs.forEach(job => {
        const terminateRow = createTerminateRow(job);
        terminateTable.appendChild(terminateRow);
    });
};

const manualTerminate = () => {
    // Find the running job in the PCB table
    const runningJobIndex = jobs.findIndex(job => job.status === 'Running');

    // If no running job is found, show an alert
    if (runningJobIndex === -1) {
        alert('No running jobs available in the PCB table.');
        return;
    }

    // Set burst time of the terminated job to 0
    jobs[runningJobIndex].burstTime = 0;

    // Update the display of the PCB table
    displayPCBJobs();
};

// Function to reset clock to 0 and clear tables
const reset = () => {

    // Clear all table outputs
    clearTables();

    // Reset clock to 0
    resetClock();
};

// Function to reset clock to 0
const resetClock = () => {
    clockModel.updateTime(0); // Reset time to 0
};

const displayIOProcesses = () => {
    const ioTable = document.querySelector('.io-process table');
    
    // Clear existing rows
    ioTable.innerHTML = '<thead><tr><th>Process Name</th><th>Running Time</th><th>Response Time</th><th>Status</th></tr></thead>';
    
    // Add rows for each I/O process
    ioProcesses.forEach(ioProcess => {
        const ioRow = createIOElement(ioProcess);
        ioTable.appendChild(ioRow);
    });
}


// Call displayClock to start displaying the clock
displayClock();

// Add event listener to the "Add Job" button
// document.getElementById('add').addEventListener('click', createJob);