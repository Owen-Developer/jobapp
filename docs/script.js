if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(() => console.log("Service Worker registered!"))
    .catch(err => console.error("Service Worker registration failed:", err));
}

// remove url == "" from updates

let url = "";
//url = "https://google.com";
let gitName = "";
if(!window.location.href.includes("localhost")){
    url = "https://servers.nextdesignwebsite.com/job";
    gitName = "";
}
let timer = 0;
let timeInt;
let timerPaused = false;
let calendarIdx = 0;
let jobId;
let currentPage = document.querySelector(".page-holder");
const isMobile =
  window.matchMedia('(pointer: coarse)').matches &&
  window.matchMedia('(hover: none)').matches;

const months = [
"January",
"February",
"March",
"April",
"May",
"June",
"July",
"August",
"September",
"October",
"November",
"December"
];
const shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

let params = new URLSearchParams(window.location.search);

function createHtml(){
    let homeBav = document.createElement("div");
    homeBav.classList.add("home-bav");
    homeBav.innerHTML = `
        <div class="home-bav">
            <div onclick="changePage(0)" class="home-bav-col">
                <div class="home-bav-icon">
                <img src="images/icons/home.png" class="home-bav-icon invisible" />
                <img src="images/icons/homeblue.png" class="home-bav-icon home-bav-active" />
                </div>
                <div class="home-bav-txt home-bav-active">Home</div>
            </div>
            <div onclick="changePage(1)" class="home-bav-col">
            <div class="home-bav-icon">
            <img src="images/icons/worker.png" class="home-bav-icon" />
            <img src="images/icons/workerblue.png" class="home-bav-icon home-bav-active invisible" />
            </div>
                <div class="home-bav-txt">Workers</div>
            </div>
            <div onclick="changePage(2)" class="home-bav-col">
            <div class="home-bav-icon">
            <img src="images/icons/pricing.png" class="home-bav-icon" />
            <img src="images/icons/pricingblue.png" class="home-bav-icon home-bav-active invisible" />
            </div>
                <div class="home-bav-txt">Pricing</div>
            </div>
            <div onclick="changePage(3)" class="home-bav-col">
            <div class="home-bav-icon">
            <img src="images/icons/chart.png" class="home-bav-icon" />
            <img src="images/icons/chartblue.png" class="home-bav-icon home-bav-active invisible" />
            </div>
                <div class="home-bav-txt">Reports</div>
            </div>
            <div onclick="changePage(4)" class="home-bav-col">
            <div class="home-bav-icon">
            <img src="images/icons/user.png" class="home-bav-icon" />
            <img src="images/icons/userblue.png" class="home-bav-icon home-bav-active invisible" />
            </div>
                <div class="home-bav-txt">Account</div>
            </div>
        </div>
    `;

    if(params.get("admin") && !document.querySelector(".dashboard")){
        document.body.appendChild(homeBav);    
    }
}
createHtml();

function getCurrentDate() {
    const today = new Date();

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const yyyy = today.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}
let todayDate = getCurrentDate();

function getSpecificDate(daysAgo) {
    const today = new Date();

    today.setDate(today.getDate() - daysAgo);

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}

function isDateBetween(target, start, end) {
    function parse(dateStr) {
        const parts = dateStr.split("/");
        const month = Number(parts[0]) - 1; // JS months 0-11
        const day = Number(parts[1]);
        const year = Number(parts[2]);
        return new Date(year, month, day).getTime();
    }

    const t = parse(target);
    const s = parse(start);
    const e = parse(end);

    return t >= s && t <= e; // inclusive
}

function getDay(dateStr){
    const realStr = dateStr.split("/")[2] + "-" + dateStr.split("/")[1] + "-" + dateStr.split("/")[0];
    const date = new Date(realStr);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
}

function getTime(){
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
    return timeString;
}

function isDateFuture(other, test){
    let todayDay = Number(other.slice(0, 2));
    let todayMonth = Number(other.slice(3, 5));
    let todayYear = Number(other.slice(-4));
    let testDay = Number(test.slice(0, 2));
    let testMonth = Number(test.slice(3, 5));
    let testYear = Number(test.slice(-4));

    if(testYear > todayYear || (testYear == todayYear && testMonth > todayMonth) || (testYear == todayYear && testMonth == todayMonth && testDay >= todayDay)){
        return true;
    } else {
        return false;
    }
}

function sortChronologically(array){
    console.log(array);
    array.forEach((arr, arrIdx) => {
        let date = arr.job_date;
        let amountBefore = 0;

        array.forEach((other, otherIdx) => {
            if(arrIdx != otherIdx){
                if(isDateFuture(other.job_date || getCurrentDate(), date || getCurrentDate())){
                    amountBefore++;
                }
            }
        });
        arr.chronOrder = amountBefore;
    });

    let newArray = [];
    for(let i = 0; i < array.length; i++){
        array.forEach(arr => {
            if(arr.chronOrder == i){
                newArray.push(arr);
            }
        });
    }

    return newArray;
}

function changePage(pageIdx){
    if(document.querySelector(".home-bav")){
        document.querySelectorAll("div.home-bav-col").forEach((other) => {
            other.querySelectorAll("img")[0].classList.remove("invisible");
            other.querySelectorAll("img")[1].classList.add("invisible");
            other.querySelector(".home-bav-txt").classList.remove("home-bav-active");
        });
        document.querySelectorAll("div.home-bav-icon")[pageIdx].querySelector("img").classList.add("invisible");
        document.querySelectorAll("div.home-bav-icon")[pageIdx].querySelectorAll("img")[1].classList.remove("invisible");
        document.querySelectorAll(".home-bav-txt")[pageIdx].classList.add("home-bav-active");
    }

    document.querySelectorAll(".page-holder").forEach(other => {
        other.style.display = "none";
    });
    document.querySelectorAll(".page-holder")[pageIdx].style.display = "block";
    currentPage = document.querySelectorAll(".page-holder")[pageIdx];
    window.scrollTo({
        top: 0,
    });
}

console.log(JSON.stringify(localStorage.getItem("summaryUpdates")));

async function getUserData(){
    try {
        let data = {};
        let userData;
        try {
            const response = await fetch(`${url}/api/get-user`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                credentials: 'include'
            });
            data = await response.json(); 
        } catch(err){
            data.userData = JSON.parse(localStorage.getItem("userData"));
            userData = data.userData;
        }

        if(data.message == "success"){
            userData = data.userData;
            localStorage.setItem("userData", JSON.stringify(userData));
        } else if(data.message == "nouser") {
            userData = "nouser";
            if(!document.querySelector(".login") && !document.querySelector(".setup")) window.location.href = gitName + "/login.html";
        } else if(data.message == "setup"){
            if(!document.querySelector(".login") && !document.querySelector(".setup")) window.location.href = gitName + "/setup.html";
        }

        document.querySelectorAll(".starter").forEach((el, idx) => {
            setTimeout(() => {
                el.style.transform = "translateY(0px)";
                el.style.opacity = "1";
            }, (idx + 1) * 400);
        });
        document.querySelectorAll(".thank-modal").forEach(modal => {
            modal.querySelector(".btn-thank-modal").addEventListener("click", () => {
                if(modal.id == "summaryThankModal"){
                    changePage(0);
                } else {
                    window.location.reload();
                }
            });
        }); 

        async function publishOfflineData(){
            if(navigator.onLine && url == ""){
                if(localStorage.getItem("jobUpdates") && localStorage.getItem("jobUpdates").includes("[")){
                    let jobUpdates = JSON.parse(localStorage.getItem("jobUpdates"));
                    for(update of jobUpdates){
                        const dataToSend = { time: update[1], jobId: update[0] };
                        try {
                            await fetch(url + "/api/end-job", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(dataToSend)
                            });
                        } catch(err){
                            console.error(err);
                        }
                    }
                }

                if(localStorage.getItem("summaryUpdates") && localStorage.getItem("summaryUpdates").includes("[")){
                    let summaryUpdates = JSON.parse(localStorage.getItem("summaryUpdates"));
                    for(update of summaryUpdates){
                        const dataToSend = update;
                        try {
                            await fetch(url + "/api/send-summary", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(dataToSend)
                            });
                        } catch(err){
                            console.error(err);
                        }
                    }
                }

                localStorage.setItem("jobUpdates", "");
                localStorage.setItem("summaryUpdates", "");
            }
        }
        publishOfflineData();

        /*/////////////// PAGES ////////////////*/
        if(document.querySelector(".home")){
            document.querySelector(".home-name").textContent = userData.name;

            let jobs;
            async function getHomeJobs() {
                try {
                    let data = {};
                    try{
                        const response = await fetch(`${url}/api/get-jobs`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                            credentials: 'include'
                        });
                        data = await response.json(); 
                    } catch(err){
                        data.jobs = JSON.parse(localStorage.getItem("jobs"));
                        data.messageFound = true;
                    }
                    if(data.messageFound){
                        jobs = data.jobs;
                        localStorage.setItem("jobs", JSON.stringify(jobs));
                        let validJobs = 0;
                        data.jobs.forEach(job => {
                            let newJob = document.createElement("div");
                            newJob.classList.add("job-wrapper");
                            newJob.id = job.id;
                            newJob.innerHTML = `
                                <div class="job-head">${job.job_name}</div>
                                <div class="job-col">
                                    <div class="job-flex">
                                        <i class="fa-regular fa-user job-icon"></i>
                                        <div class="job-txt">${job.job_customer}</div>
                                    </div>
                                    <div class="job-flex">
                                        <i class="fa-regular fa-compass job-icon"></i>
                                        <div class="job-txt">${job.job_address}</div>
                                    </div>
                                    <div class="job-flex">
                                        <i class="fa-regular fa-clock job-icon"></i>
                                        <div class="job-txt">${job.job_date} - ${job.job_time}</div>
                                    </div>
                                </div>
                                <div class="btn-job">Start Job</div>
                            `;
                            newJob.querySelector(".btn-job").addEventListener("click", () => {
                                jobId = job.id;
                                timerLogic();
                                changePage(1);
                            });
                            if(job.job_status == "Completed"){
                                newJob.style.display = "none";
                                newJob.innerHTML = `
                                    <div class="job-head">${job.job_name}</div>
                                    <div class="job-col">
                                        <div class="job-flex">
                                            <i class="fa-regular fa-user job-icon"></i>
                                            <div class="job-txt">${job.job_customer}</div>
                                        </div>
                                        <div class="job-flex">
                                            <i class="fa-regular fa-compass job-icon"></i>
                                            <div class="job-txt">${job.job_address}</div>
                                        </div>
                                        <div class="job-flex">
                                            <i class="fa-regular fa-clock job-icon"></i>
                                            <div class="job-txt">Completed - ${job.job_date}</div>
                                        </div>
                                    </div>
                                    <div style="opacity: 0.5; pointer-events: none;" class="btn-job">Start Job</div>
                                `;
                            } else {
                                validJobs++;
                            }
                            document.querySelector(".job-ul").appendChild(newJob);
                        });
                        if(validJobs == 0){
                            document.getElementById("jobEmpty").style.display = "block";
                        }
                    } else {
                        document.getElementById("jobEmpty").style.display = "block";
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
            getHomeJobs();

            document.querySelector("#homeSearch").addEventListener("input", () => {
                document.querySelector(".search-drop").innerHTML = "";
                let newValue = document.querySelector("#homeSearch input").value;
                if(newValue.length > 0 && jobs){
                    jobs.forEach(job => {
                        if(job.job_name.toLowerCase().includes(newValue.toLowerCase())){
                            let newOption = document.createElement("div");
                            newOption.classList.add("search-option");
                            let lowerValue = newValue.toLowerCase();
                            let lowerJob = job.job_name.toLowerCase();
                            let firstIdx = lowerJob.indexOf(lowerValue);
                            let lastIdx = firstIdx + (lowerValue.length - 1);
                            let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                            let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                            newOption.innerHTML = finalOption;
                            document.querySelector(".search-drop").appendChild(newOption);

                            newOption.addEventListener("click", () => {
                                let jobWrapper;
                                document.querySelectorAll(".job-wrapper").forEach(wrapper => {
                                    if(wrapper.id == job.id){
                                        jobWrapper = wrapper;
                                    }
                                });
                                if(jobWrapper){
                                    document.getElementById("jobEmpty").style.display = "none";
                                    jobWrapper.style.display = "block";
                                    jobWrapper.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center"
                                    });
                                }
                                document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                                document.querySelector(".search-drop").style.opacity = "0";
                                document.querySelector(".search-drop").style.pointerEvents = "none";
                            });
                        }
                    });
                    if(document.querySelector(".search-drop").innerHTML != ""){
                        document.querySelector("#homeSearch").classList.add("search-selector-dropped");
                        document.querySelector(".search-drop").style.opacity = "1";
                        document.querySelector(".search-drop").style.pointerEvents = "auto";
                    } else {
                        document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                        document.querySelector(".search-drop").style.opacity = "0";
                        document.querySelector(".search-drop").style.pointerEvents = "none";
                    }
                } else {
                    document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                    document.querySelector(".search-drop").style.opacity = "0";
                    document.querySelector(".search-drop").style.pointerEvents = "none";
                }
            });

            /* modal click outs */
            document.addEventListener("click", (e) => {
                if(!document.querySelector(".thank-wrapper").contains(e.target)){
                    document.querySelector(".thank-modal").style.opacity = "0";
                    document.querySelector(".thank-modal").style.pointerEvents = "none";
                }

                if(!document.querySelector("#homeSearch").contains(e.target)){
                    document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                    document.querySelector(".search-drop").style.opacity = "0";
                    document.querySelector(".search-drop").style.pointerEvents = "none";
                }
            });
            document.querySelector("#homeSearch input").addEventListener("focus", () => {
                document.querySelector(".search-drop").innerHTML = "";
                let newValue = document.querySelector("#homeSearch input").value;
                if(newValue.length > 0 && jobs){
                    jobs.forEach(job => {
                        if(job.job_name.toLowerCase().includes(newValue.toLowerCase())){
                            let newOption = document.createElement("div");
                            newOption.classList.add("search-option");
                            let newStr = job.job_name.toLowerCase().replace(newValue.toLowerCase().replace(/ /g, ""), newValue.toLowerCase().replace(/ /g, "")).split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                            let optionUpper = newValue.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                            newStr = newStr.replace(optionUpper, "<span>" + optionUpper + "</span>");
                            newOption.innerHTML = newStr;
                            document.querySelector(".search-drop").appendChild(newOption);

                            newOption.addEventListener("click", () => {
                                let jobWrapper;
                                document.querySelectorAll(".job-wrapper").forEach(wrapper => {
                                    if(wrapper.id == job.id){
                                        jobWrapper = wrapper;
                                    }
                                });
                                if(jobWrapper){
                                    jobWrapper.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center"
                                    });
                                }
                                document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                                document.querySelector(".search-drop").style.opacity = "0";
                                document.querySelector(".search-drop").style.pointerEvents = "none";
                            });
                        }
                    });
                    if(document.querySelector(".search-drop").innerHTML != ""){
                        document.querySelector("#homeSearch").classList.add("search-selector-dropped");
                        document.querySelector(".search-drop").style.opacity = "1";
                        document.querySelector(".search-drop").style.pointerEvents = "auto";
                    } else {
                        document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                        document.querySelector(".search-drop").style.opacity = "0";
                        document.querySelector(".search-drop").style.pointerEvents = "none";
                    }
                } else {
                    document.querySelector("#homeSearch").classList.remove("search-selector-dropped");
                    document.querySelector(".search-drop").style.opacity = "0";
                    document.querySelector(".search-drop").style.pointerEvents = "none";
                }
            });
        }

        if(document.querySelector(".timer")){
            function timerLogic(){
                async function updateProgress(time, jobId){
                    const dataToSend = { time: time, jobId: jobId };
                    console.log("try");
                    try {
                        const response = await fetch(url + '/api/update-progress', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                'Content-Type': 'application/json', 
                            },
                            body: JSON.stringify(dataToSend), 
                        });
    
                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Error:', errorData.message);
                            return;
                        }
                    } catch (error) {
                        console.error('Error posting data:', error);
                        let jobUpdates = [];
                        if(localStorage.getItem("jobUpdates") && localStorage.getItem("jobUpdates").includes("[")){
                            jobUpdates = JSON.parse(localStorage.getItem("jobUpdates"));
                        }
                        let newUpdate = [jobId, time];
                        let isUpdate = false;
                        jobUpdates.forEach((update, idx) => {
                            if(update[0] == newUpdate[0]){
                                update = newUpdate;
                                isUpdate = true;
                            }
                        });
                        if(!isUpdate){
                            jobUpdates.push(newUpdate);
                        }
                        localStorage.setItem("jobUpdates", JSON.stringify(jobUpdates));
                    }
                }
    
                function getElapsed(laterTime, earlierTime){
                    let elpasedHours;
                    let elpasedMinutes;
                    let elpasedSeconds;
                    elpasedHours = Number(laterTime.slice(-8, -6)) - Number(earlierTime.slice(-8, -6));
                    elpasedMinutes = Number(laterTime.slice(-5, -3)) - Number(earlierTime.slice(-5, -3));
                    if(elpasedMinutes < 0){
                        elpasedMinutes += 60;
                        elpasedHours--;
                    }
                    elpasedSeconds = Number(laterTime.slice(-2)) - Number(earlierTime.slice(-2));
                    if(elpasedSeconds < 0){
                        elpasedSeconds += 60;
                        elpasedMinutes--;
                        if(elpasedMinutes < 0){
                            elpasedMinutes += 60;
                            elpasedHours--;
                        }
                    }
                    let newTimer;
                    if(elpasedSeconds < 10) elpasedSeconds = "0" + elpasedSeconds;
                    if(elpasedHours == 0){
                        newTimer = elpasedMinutes + ":" + elpasedSeconds;
                    } else {
                        if(elpasedMinutes < 10) elpasedMinutes = "0" + elpasedMinutes;
                        newTimer = elpasedHours + ":" + elpasedMinutes + ":" + elpasedSeconds;
                    }
    
                    return newTimer;
                }
    
                function minusTime(time, sum){
                    let newHours;
                    let newMinutes;
                    let newSeconds;
    
                    if(sum.length > 4){
                        newHours = Number(time.slice(-8, -6)) - Number(sum.slice(-8, -6));
                    } else if(time.length > 5){
                        newHours = Number(time.slice(-8, -6));
                    } else {
                        newHours = 0;
                    }
    
                    newMinutes = Number(time.slice(-5, -3)) - Number(sum.slice(-5, -3));
                    if(newMinutes < 0){
                        newMinutes += 60;
                        newHours--;
                    }
    
                    newSeconds = Number(time.slice(-2)) - Number(sum.slice(-2));
                    if(newSeconds < 0){
                        newSeconds += 60;
                        newMinutes--;
                        if(newMinutes < 0){
                            newMinutes += 60;
                            newHours--;
                        }
                    }
    
                    let newTimer;
                    if(newSeconds < 10) newSeconds = "0" + newSeconds;
                    if(newHours == 0){
                        newTimer = newMinutes + ":" + newSeconds;
                    } else {
                        if(newMinutes < 10) newMinutes = "0" + newMinutes;
                        newTimer = newHours + ":" + newMinutes + ":" + newSeconds;
                    }
    
                    return newTimer;
                }
                function plusTime(time, sum){
                    let newHours;
                    let newMinutes;
                    let newSeconds;
    
                    if(sum.length > 4){
                        newHours = Number(time.slice(-8, -6)) + Number(sum.slice(-8, -6));
                    } else if(time.length > 5){
                        newHours = Number(time.slice(-8, -6));
                    } else {
                        newHours = 0;
                    }
    
                    newMinutes = Number(time.slice(-5, -3)) + Number(sum.slice(-5, -3));
                    if(newMinutes > 59){
                        newMinutes = 0;
                        newHours++;
                    }
    
                    newSeconds = Number(time.slice(-2)) + Number(sum.slice(-2));
                    if(newSeconds > 59){
                        newSeconds = 0;
                        newMinutes++;
                        if(newMinutes < 59){
                            newMinutes = 0;
                            newHours++;
                        }
                    }
    
                    let newTimer;
                    if(newSeconds < 10) newSeconds = "0" + newSeconds;
                    if(newHours == 0){
                        newTimer = newMinutes + ":" + newSeconds;
                    } else {
                        if(newMinutes < 10) newMinutes = "0" + newMinutes;
                        newTimer = newHours + ":" + newMinutes + ":" + newSeconds;
                    }
    
                    return newTimer;
                }
    
                function startTimer(){
                    timeInt = setInterval(() => {
                        /*
                        timer++;
                        let seconds = timer % 60;
                        if(seconds < 10) seconds = "0" + seconds;
                        let minutes = Math.floor(timer / 60);
                        minutes = minutes - (60 * Math.floor(minutes / 60));
                        let hours = Math.floor(timer / 3600);
                        if(hours > 0){
                            timeStr = hours + " hrs, " + minutes + " minutes";
                            if(minutes < 10) minutes = "0" + minutes;
                            document.querySelector(".tim-num").textContent = hours + ":" + minutes + ":" + seconds;
                        } else {
                            timeStr = minutes + " minutes";
                            document.querySelector(".tim-num").textContent = minutes + ":" + seconds;
                        }
                        */
    
                        let nowTime = getTime();
                        let startTime = localStorage.getItem("timeStart");
                        let totalTimer = getElapsed(nowTime, startTime);
                        if(localStorage.getItem("pauseElapsed").includes(":")){
                            document.querySelector(".tim-num").textContent = minusTime(totalTimer, localStorage.getItem("pauseElapsed"));
                        } else {
                            document.querySelector(".tim-num").textContent = totalTimer;
                        }
                        let officialTimer = document.querySelector(".tim-num").textContent;
                        if(officialTimer.length > 4){
                            timeStr = officialTimer.slice(0, officialTimer.indexOf(":")) + " hrs, " + officialTimer.slice(-5, -3) + " minutes";
                        } else {
                            timeStr = officialTimer.slice(0, officialTimer.indexOf(":")) + " minutes";
                        }
    
                        if(timer % 300 == 0){
                            updateProgress(timeStr, jobId);
                        }
                    }, 1000);
                }
                let timeStr;
                localStorage.setItem("timeStart", getTime());
                localStorage.setItem("pauseStart", "");
                localStorage.setItem("pauseElapsed", "");
                startTimer();
    
                document.querySelector(".tim-btn-pause").addEventListener("click", () => {
                    if(timerPaused){
                        startTimer();
                        document.querySelector(".tim-btn-pause").textContent = "Pause";
                        timerPaused = false;
    
                        let nowTime = getTime();
                        let previousElapsed = localStorage.getItem("pauseElapsed");
                        localStorage.setItem("pauseElapsed", plusTime(getElapsed(nowTime, localStorage.getItem("pauseStart")), previousElapsed));
                    } else {
                        clearInterval(timeInt);
                        document.querySelector(".tim-btn-pause").textContent = "Continue";
                        timerPaused = true;
    
                        localStorage.setItem("pauseStart", getTime());
                    }
                });
                document.querySelector(".tim-btn-end").addEventListener("click", () => {
                    async function endJob(){
                        const dataToSend = { time: timeStr, jobId: jobId };
                        try {
                            const response = await fetch(url + '/api/end-job', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                    'Content-Type': 'application/json', 
                                },
                                body: JSON.stringify(dataToSend), 
                            });
    
                            if (!response.ok) {
                                const errorData = await response.json();
                                console.error('Error:', errorData.message);
                                return;
                            }
    
                            const data = await response.json();
                            if(data.message == "success"){
                                clearInterval(timeInt);
                                changePage(2);
                                summaryLogic();
                            }
                        } catch (error) {
                            clearInterval(timeInt);
                            console.error('Error posting data:', error);
                            changePage(2);
                            summaryLogic();
                        }
                    }
                    endJob();
                });
            }
        }

        if(document.querySelector(".summary")){
            function summaryLogic(){
                let date;
                async function getJobs() {
                    try {
                        const response = await fetch(`${url}/api/get-jobs`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                            credentials: 'include'
                        });
                        const data = await response.json(); 
                        if(data.messageFound){
                            data.jobs.forEach(job => {
                                if(job.id == jobId){
                                    let dd = job.job_date.split("/")[0];
                                    if(dd.slice(0, 1) == "0") dd = dd.slice(1);
                                    document.querySelector(".edit-date-txt").textContent = dd + " " + months[Number(job.job_date.split("/")[1]) - 1] + " " + job.job_date.split("/")[2];
                                    date = job.job_date;
                                    document.querySelectorAll(".edit-change-num").forEach((num, idx) => {
                                        num.textContent = job.job_date.split("/")[idx];
                                        if(num.textContent.length == 4) num.textContent = num.textContent.slice(2);
                                    });
                                    document.querySelector(".edit-title-input").value = job.job_name;
                                }
                            });
                        } else {
                        }
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                }
                getJobs();
    
                document.querySelectorAll(".edit-toggle-option").forEach((option, idx) => {
                    option.addEventListener("click", () => {
                        let toggleOptions = ["left", "right"];
                        document.querySelector(".edit-toggle span").classList.remove("edit-toggle-left");
                        document.querySelector(".edit-toggle span").classList.remove("edit-toggle-right");
                        document.querySelector(".edit-toggle span").classList.add("edit-toggle-" + toggleOptions[idx]);
                        document.querySelectorAll(".edit-toggle-option").forEach((opt, optIdx) => {
                            opt.style.color = "hsl(0, 0%, 20%)";
                            if(optIdx == idx) opt.style.color = "white";
                        });
                        document.querySelectorAll(".edit-content").forEach(cont => {
                            cont.style.opacity = "0";
                            setTimeout(() => {
                                cont.style.display = "none";
                                document.querySelectorAll(".edit-content")[idx].style.display = "flex";
                                setTimeout(() => {
                                    document.querySelectorAll(".edit-content")[idx].style.opacity = "1";
                                }, 50);
                            }, 300);
                        });
                    });
                });
    
                document.querySelector(".edit-date-wrapper").addEventListener("click", (e) => {
                    if(!document.querySelector(".edit-change").contains(e.target)){
                        if(document.querySelector(".edit-date-chev").style.transform == "rotate(-90deg)"){
                            document.querySelector(".edit-change").style.opacity = "0";
                            document.querySelector(".edit-change").style.pointerEvents = "none";
                            document.querySelector(".edit-date-chev").style.transform = "rotate(90deg)";
                        } else {
                            document.querySelector(".edit-change").style.opacity = "1";
                            document.querySelector(".edit-change").style.pointerEvents = "auto";
                            document.querySelector(".edit-date-chev").style.transform = "rotate(-90deg)";
                        }
                    }
                });
                document.querySelectorAll(".edit-change-col").forEach((col, colIdx) => {
                    col.querySelectorAll(".edit-change-chev").forEach((chev, idx) => {
                        chev.addEventListener("click", () => {
                            if(idx == 0){
                                col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) + 1;
                                if(Number(col.querySelector(".edit-change-num").textContent) > 31 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "1";
                                if(Number(col.querySelector(".edit-change-num").textContent) > 12 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "1";
                                if(Number(col.querySelector(".edit-change-num").textContent) > 25 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "25";
                            } else {
                                col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) - 1;
                                if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "31";
                                if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "12";
                                if(Number(col.querySelector(".edit-change-num").textContent) < 10 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "10";
                            }
                            let day = document.querySelectorAll(".edit-change-num")[0].textContent;
                            if(day.length == 0) day = "0" + day;
                            let month = document.querySelectorAll(".edit-change-num")[1].textContent;
                            if(month.length == 0) month = "0" + month;
                            let year = "20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                            date = day + "/" + month + "/" + year;
                        });
                    });
                });
                document.querySelector(".btn-change-save").addEventListener("click", () => {
                    document.querySelector(".edit-change").style.opacity = "0";
                    document.querySelector(".edit-change").style.pointerEvents = "none";
                    document.querySelector(".edit-date-chev").style.transform = "rotate(90deg)";
    
                    let dd = document.querySelectorAll(".edit-change-num")[0].textContent;
                    if(dd.slice(0, 1) == "0") dd = dd.slice(1);
                    document.querySelector(".edit-date-txt").textContent = document.querySelectorAll(".edit-change-num")[0].textContent + " " + months[Number(document.querySelectorAll(".edit-change-num")[1].textContent - 1)] + " 20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                });
                document.querySelector(".btn-change-cancel").addEventListener("click", () => {
                    document.querySelector(".edit-change").style.opacity = "0";
                    document.querySelector(".edit-change").style.pointerEvents = "none";
                    document.querySelector(".edit-date-chev").style.transform = "rotate(90deg)";
                });
    
                document.getElementById("photoInput").addEventListener("change", (e) => {
                    document.querySelector(".edit-upload-img img").src = URL.createObjectURL(e.target.files[0]);
                    document.querySelector(".edit-upload-content").style.opacity = "0";
                    setTimeout(() => {
                        document.querySelector(".edit-upload-content").style.display = "none";
                        document.querySelector(".edit-upload-img").style.display = "flex";
                        setTimeout(() => {
                            document.querySelector("i.edit-close").style.opacity = "1";
                            document.querySelector(".edit-upload-img").style.maxHeight = "600px";
                            document.querySelector(".edit-upload-img").style.marginTop = "25px";
                        }, 50);
                    }, 300);
                });
                document.querySelector("i.edit-close").addEventListener("click", () => {
                    document.querySelector(".edit-upload-img").style.opacity = "0";
                    document.querySelector(".edit-upload-img").style.maxHeight = "0px";
                    document.querySelector(".edit-upload-img").style.marginTop = "0px";
                    setTimeout(() => {
                        document.querySelector(".edit-upload-content").style.display = "flex";
                        document.querySelector(".edit-upload-img").style.display = "none";
                        setTimeout(() => {
                            document.querySelector("i.edit-close").style.opacity = "0";
                            document.querySelector(".edit-upload-content").style.opacity = "1";
                        }, 50);
                    }, 400);
                });
    
                document.querySelectorAll(".edit-mat-selector").forEach((sel, idx) => {
                    sel.addEventListener("click", (e) => {
                        if(!sel.querySelector(".edit-mat-drop").contains(e.target)){
                            if(sel.querySelector(".edit-mat-chev").style.transform == "rotate(-90deg)"){
                                sel.style.marginBottom = "0px";
                                sel.querySelector(".edit-mat-drop").style.opacity = "0";
                                sel.querySelector(".edit-mat-drop").style.pointerEvents = "none";
                                sel.querySelector(".edit-mat-chev").style.transform = "rotate(90deg)";
                            } else {
                                let marginBottom = sel.querySelector(".edit-mat-drop").offsetHeight + 27 + "px";
                                sel.style.marginBottom = marginBottom;
                                sel.querySelector(".edit-mat-drop").style.opacity = "1";
                                sel.querySelector(".edit-mat-drop").style.pointerEvents = "auto";
                                sel.querySelector(".edit-mat-chev").style.transform = "rotate(-90deg)";
                            }
                        }
                    });
                });
    
                document.querySelector(".edit-upload-btn").addEventListener("click", () => {
                    document.getElementById("photoInput").click();
                });
    
                let materials = []; // [name, value, unit]
                let charges = [];
                async function getMaterials() {
                    let data = {};
                    try {
                        const response = await fetch(`${url}/api/get-materials`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                            credentials: 'include'
                        });
                        data = await response.json();

                        localStorage.setItem("materials", JSON.stringify(data.materials));
                    } catch (error) {
                        console.error('Error fetching data:', error);
                        if(localStorage.getItem("materials") && localStorage.getItem("materials").includes("[")){
                            data.materials = JSON.parse(localStorage.getItem("materials"));
                        } else {
                            data.materials = [];
                        }
                    }
                    document.querySelectorAll(".edit-mat-wrapper").forEach(wrapper => {
                        if(wrapper.id == "chargeWrapper"){
                            data.materials.forEach(mat => {
                                if(mat.area == "charges"){
                                    let newOption = document.createElement("div");
                                    newOption.classList.add("edit-mat-option");
                                    newOption.id = "charge-" + mat.id;
                                    newOption.innerHTML = mat.name + ' <i class="fa-solid fa-check"></i>';
                                    wrapper.querySelector(".edit-mat-drop").appendChild(newOption);
                                }
                            });
                            wrapper.querySelectorAll(".edit-mat-option").forEach(option => {
                                option.addEventListener("click", () => {
                                    if(!option.classList.contains("edit-mat-active")){
                                        charges.push(option.id.split("-")[1]);
                                        option.classList.add("edit-mat-active");
                                        let newMaterial = document.createElement("div");
                                        newMaterial.classList.add("edit-mat-section");
                                        newMaterial.innerHTML = `
                                            <div class="edit-mat-name">${option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)}</div>
                                            <i class="fa-solid fa-trash-can edit-charge-delete" style="display: block;"></i>
                                        `;
                                        wrapper.querySelector(".edit-mat-col").appendChild(newMaterial);
                                        setTimeout(() => {
                                            wrapper.querySelector(".edit-mat-col").style.marginTop = "25px";
                                            newMaterial.style.maxHeight = "40px";
                                            newMaterial.style.opacity = "1";
                                        }, 30);
    
                                        newMaterial.querySelector("i.edit-charge-delete").addEventListener("click", () => {
                                            option.classList.remove("edit-mat-active");
                                            newMaterial.style.maxHeight = "0px";
                                            newMaterial.style.opacity = "0";
                                            setTimeout(() => {
                                                wrapper.querySelector(".edit-mat-col").removeChild(newMaterial);
                                            }, 300);
                                            charges.splice(charges.indexOf(option.id.split("-")[1]), 1);
                                            if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                            }
                                        });    
                                    } else {
                                        charges.splice(charges.indexOf(option.id.split("-")[1]), 1);
                                        option.classList.remove("edit-mat-active");
                                        document.querySelectorAll(".edit-mat-section").forEach(section => {
                                            if(section.querySelector(".edit-mat-name").innerHTML == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                section.style.maxHeight = "0px";
                                                section.style.opacity = "0";
                                                setTimeout(() => {
                                                    wrapper.querySelector(".edit-mat-col").removeChild(section);
                                                }, 300);
                                            }
                                        });
                                        if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                            wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                        }
                                    }
                                });
                            });
                        } else {
                            data.materials.forEach(mat => {
                                if(wrapper.querySelector(".edit-mat-label").textContent.toLowerCase() == mat.type.toLowerCase() && mat.area == "materials"){
                                    let newOption = document.createElement("div");
                                    newOption.classList.add("edit-mat-option");
                                    newOption.id = mat.default_value + "-" + mat.unit + "-" + mat.default_value + "-" + mat.step; // value, unit, default, step
                                    newOption.innerHTML = mat.name + ' <i class="fa-solid fa-check"></i>';
                                    wrapper.querySelector(".edit-mat-drop").appendChild(newOption);
                                }
                            });
                            wrapper.querySelectorAll(".edit-mat-option").forEach(option => {
                                option.addEventListener("click", () => {
                                    if(!option.classList.contains("edit-mat-active")){
                                        option.classList.add("edit-mat-active");
                                        let newMaterial = document.createElement("div");
                                        newMaterial.classList.add("edit-mat-section");
                                        newMaterial.innerHTML = `
                                            <div class="edit-mat-name">${option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)}</div>
                                            <div class="edit-mat-quan">
                                                <i class="fa-solid fa-minus edit-mat-minus"></i>
                                                <i class="fa-solid fa-trash-can edit-mat-delete"></i>
                                                <span>${option.id.split("-")[0]} <span>${option.id.split("-")[1]}</span></span>
                                                <i class="fa-solid fa-plus edit-mat-plus"></i>
                                            </div>
                                        `;
                                        if((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) <= 0){
                                            newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                            newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                        }
                                        wrapper.querySelector(".edit-mat-col").appendChild(newMaterial);
                                        setTimeout(() => {
                                            wrapper.querySelector(".edit-mat-col").style.marginTop = "25px";
                                            newMaterial.style.maxHeight = "40px";
                                            newMaterial.style.opacity = "1";
                                        }, 30);
    
                                        newMaterial.querySelector("i.edit-mat-plus").addEventListener("click", () => {
                                            newMaterial.querySelector(".edit-mat-quan span").innerHTML = String(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) + Number(option.id.split("-")[3])) + newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)
                                            newMaterial.querySelector("i.edit-mat-delete").style.display = "none";
                                            newMaterial.querySelector("i.edit-mat-minus").style.display = "block";
                                            option.id = String(Number(option.id.split("-")[0]) + Number(option.id.split("-")[3])) + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                            materials.forEach(material => {
                                                if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                    material[1] = option.id.split("-")[0];
                                                } 
                                            });
                                        });
                                        newMaterial.querySelector("i.edit-mat-minus").addEventListener("click", () => {
                                            newMaterial.querySelector(".edit-mat-quan span").innerHTML = String(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) - Number(option.id.split("-")[3])) + newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)
                                            if(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) == 1){
                                                newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                                newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                            }
                                            option.id = String(Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                            materials.forEach(material => {
                                                if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                    material[1] = option.id.split("-")[0];
                                                } 
                                            });
                                            console.log((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])));
                                            if((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) <= 0){
                                                newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                                newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                            }
                                        });
                                        newMaterial.querySelector("i.edit-mat-delete").addEventListener("click", () => {
                                            newMaterial.style.maxHeight = "0px";
                                            newMaterial.style.opacity = "0";
                                            setTimeout(() => {
                                                wrapper.querySelector(".edit-mat-col").removeChild(newMaterial);
                                            }, 300);
                                            option.classList.remove("edit-mat-active");
                                            if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                            }
                                            materials.forEach((material, idx) => {
                                                if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                    materials.splice(idx, 1);
                                                    option.id = option.id.split("-")[2] + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                                } 
                                            });
                                        });
    
                                        let newArray = [option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1), option.id.split("-")[0], option.id.split("-")[1]]; 
                                        materials.push(newArray);
                                    } else {
                                        option.classList.remove("edit-mat-active");
                                        document.querySelectorAll(".edit-mat-section").forEach(section => {
                                            if(section.querySelector(".edit-mat-name").innerHTML == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                section.style.maxHeight = "0px";
                                                section.style.opacity = "0";
                                                setTimeout(() => {
                                                    wrapper.querySelector(".edit-mat-col").removeChild(section);
                                                }, 300);
                                            }
                                        });
                                        option.classList.remove("edit-mat-active");
                                        if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                            wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                        }
                                    }
                                });
                            });
                        }

                    });
                }
                getMaterials();
    
                document.querySelector(".edit-save-btn").addEventListener("click", () => {
                    async function sendSummary() {
                        const dataToSend = { jobId: jobId, date: date || getCurrentDate(), notes: document.querySelector(".edit-para-area").value, materials: materials, charges: charges };
                        try {
                            const response = await fetch(url + '/api/send-summary', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                    'Content-Type': 'application/json', 
                                },
                                body: JSON.stringify(dataToSend), 
                            });
    
                            if (!response.ok) {
                                const errorData = await response.json();
                                console.error('Error:', errorData.message);
                                return;
                            }
    
                            const data = await response.json();
                            if(data.message == "success"){
                                document.getElementById(jobId).style.display = "none";
                                document.getElementById("summaryThankModal").style.opacity = "1";
                                document.getElementById("summaryThankModal").style.pointerEvents = "auto";
                                setTimeout(() => {
                                    document.getElementById("summaryThankModal").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("summaryThankModal").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        } catch (error) {
                            console.error('Error posting data:', error);
                            let summaryUpdates = [];
                            if(localStorage.getItem("summaryUpdates") && localStorage.getItem("summaryUpdates").includes("[")){
                                summaryUpdates = JSON.parse(localStorage.getItem("summaryUpdates"));
                            }
                            summaryUpdates.push(dataToSend);
                            localStorage.setItem("summaryUpdates", JSON.stringify(summaryUpdates));

                            document.getElementById(jobId).style.display = "none";
                            document.getElementById("summaryThankModal").style.opacity = "1";
                            document.getElementById("summaryThankModal").style.pointerEvents = "auto";
                            setTimeout(() => {
                                document.getElementById("summaryThankModal").querySelector(".thank-wrapper").style.opacity = "1";
                                document.getElementById("summaryThankModal").querySelector(".thank-wrapper").style.transform = "scale(1)";
                            }, 300);
                        }
                    }
                    sendSummary();
                });
    
                /* modal click outs */
                document.addEventListener("click", (e) => {
                    document.querySelectorAll(".edit-mat-selector").forEach(sel => {
                        if(!sel.contains(e.target)){
                            sel.style.marginBottom = "0px";
                            sel.querySelector(".edit-mat-drop").style.opacity = "0";
                            sel.querySelector(".edit-mat-drop").style.pointerEvents = "none";
                            sel.querySelector(".edit-mat-chev").style.transform = "rotate(90deg)";
                        }
                    });
    
                    if(!document.querySelector(".edit-date-wrapper").contains(e.target)){
                        document.querySelector(".edit-change").style.opacity = "0";
                        document.querySelector(".edit-change").style.pointerEvents = "none";
                        document.querySelector(".edit-date-chev").style.transform = "rotate(90deg)";
                    }
                });
            }
        }

        if(document.querySelector(".account")){
            document.querySelector(".acc-name").textContent = userData.name;
            document.querySelector(".acc-email").textContent = userData.email;

            if(params.get("admin")){
                document.querySelector(".acc-back").style.display = "none";
                document.querySelector(".acc-title").style.marginTop = "30px";
            } else {
                document.querySelector(".acc-back").addEventListener("click", () => {
                    changePage(0);
                }); 
            }

            document.getElementById("editProfileBtn").addEventListener("click", () => {
                document.querySelector(".home-name").value = userData.name;
                document.getElementById("profileName").value = userData.name;
                document.getElementById("profileEmail").value = userData.email;
                document.getElementById("profilePhone").value = userData.phone;
                document.getElementById("profileModal").style.opacity = "1";
                document.getElementById("profileModal").style.pointerEvents = "auto";
                document.getElementById("profileModal").style.left = "0px";
            });
            document.getElementById("profileBack").addEventListener("click", () => {
                document.getElementById("profileModal").style.opacity = "0";
                document.getElementById("profileModal").style.pointerEvents = "none";
                document.getElementById("profileModal").style.left = "255px";
            });
            document.getElementById("saveProfileBtn").addEventListener("click", () => {
                async function saveProfile() {
                    const dataToSend = { name: document.getElementById("profileName").value, email: document.getElementById("profileEmail").value, phone: document.getElementById("profilePhone").value };
                    try {
                        const response = await fetch(url + '/api/save-profile', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                'Content-Type': 'application/json', 
                            },
                            body: JSON.stringify(dataToSend), 
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Error:', errorData.message);
                            return;
                        }

                        const data = await response.json();
                        if(data.message == "success"){
                            userData = data.userData;
                            document.querySelector(".home-name").textContent = userData.name;
                            document.querySelector(".acc-name").textContent = userData.name;
                            document.querySelector(".acc-email").textContent = userData.email;
                            document.getElementById("profileModal").style.opacity = "0";
                            document.getElementById("profileModal").style.pointerEvents = "none";
                            document.getElementById("profileModal").style.left = "255px";
                        }
                    } catch (error) {
                        console.error('Error posting data:', error);
                    }
                }
                saveProfile();
            });

            document.getElementById("newPasswordBtn").addEventListener("click", () => {
                document.getElementById("changePasswordModal").style.opacity = "1";
                document.getElementById("changePasswordModal").style.pointerEvents = "auto";
            });
            document.getElementById("changePasswordBtn").addEventListener("click", () => {
                async function changePassword() {
                    const dataToSend = { currentPassword: document.getElementById("currentPassword").value, newPassword: document.getElementById("newPassword").value };
                    try {
                        const response = await fetch(url + '/api/change-password', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                'Content-Type': 'application/json', 
                            },
                            body: JSON.stringify(dataToSend), 
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Error:', errorData.message);
                            return;
                        }

                        const data = await response.json();
                        if(data.message == "success"){
                            document.getElementById("changePasswordModal").style.opacity = "0";
                            document.getElementById("changePasswordModal").style.pointerEvents = "none";
                            setTimeout(() => {
                                document.getElementById("thankPassword").style.opacity = "1";
                                document.getElementById("thankPassword").style.pointerEvents = "auto";
                                document.getElementById("thankPassword").querySelector(".thank-wrapper").style.opacity = "1";
                                document.getElementById("thankPassword").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                document.getElementById("changePasswordModal").querySelectorAll("input").forEach(input => {
                                    input.value = "";
                                });
                            }, 300);
                        } else if(data.message == "failure"){
                            document.getElementById("randomError").style.display = "block";
                            setTimeout(() => {
                                document.getElementById("randomError").style.display = "none";
                            }, 2000);
                        } else if(data.message == "invalid password"){
                            document.getElementById("invalidError").style.display = "block";
                            setTimeout(() => {
                                document.getElementById("invalidError").style.display = "none";
                            }, 2000);
                        }
                    } catch (error) {
                        console.error('Error posting data:', error);
                    }
                }
                if(document.getElementById("newPassword").value == document.getElementById("confirmPassword").value){
                    changePassword();
                } else {
                    document.getElementById("diffError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("diffError").style.display = "none";
                    }, 2000);
                }
            });

            document.getElementById("newContactBtn").addEventListener("click", () => {
                document.getElementById("contactModal").style.opacity = "1";
                document.getElementById("contactModal").style.pointerEvents = "auto";
            });
            document.getElementById("contactForm").addEventListener("submit", async (e) => {
                e.preventDefault(); 
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                const res = await fetch(url + "/api/contact", {
                    method: "POST",
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const responseData = await res.json();
                if(responseData.message == "success"){
                    document.getElementById("contactModal").style.opacity = "0";
                    document.getElementById("contactModal").style.pointerEvents = "none";
                    setTimeout(() => {
                        document.getElementById("thankContact").style.opacity = "1";
                        document.getElementById("thankContact").style.pointerEvents = "auto";
                        document.getElementById("thankContact").querySelector(".thank-wrapper").style.opacity = "1";
                        document.getElementById("thankContact").querySelector(".thank-wrapper").style.transform = "scale(1)";
                    }, 300);
                }
            });

            document.getElementById("newPushBtn").addEventListener("click", () => {
                document.getElementById("pushModal").style.opacity = "1";
                document.getElementById("pushModal").style.pointerEvents = "auto";
                document.getElementById("pushModal").style.left = "0px";
            });
            document.getElementById("pushBack").addEventListener("click", () => {
                document.getElementById("pushModal").style.opacity = "0";
                document.getElementById("pushModal").style.pointerEvents = "none";
                document.getElementById("pushModal").style.left = "255px";
            });
            document.querySelectorAll(".push-toggle").forEach(toggle => {
                toggle.addEventListener("click", () => {
                    if(toggle.classList.contains("push-toggle-active")){
                        toggle.querySelector("span").classList.remove("push-toggle-right");
                        toggle.querySelector("span").classList.add("push-toggle-left");
                        toggle.classList.remove("push-toggle-active");
                    } else {
                        toggle.querySelector("span").classList.add("push-toggle-right");
                        toggle.querySelector("span").classList.remove("push-toggle-left");
                        toggle.classList.add("push-toggle-active");
                    }
                });
            });

            document.getElementById("newLogout").addEventListener("click", () => {
                document.getElementById("logoutModal").style.opacity = "1";
                document.getElementById("logoutModal").style.pointerEvents = "auto";
            });
            document.getElementById("logoutModal").addEventListener("click", (e) => {
                if(!document.getElementById("logoutModal").querySelector(".book-delete-wrapper").contains(e.target)){
                    document.getElementById("logoutModal").style.opacity = "0";
                    document.getElementById("logoutModal").style.pointerEvents = "none";
                }
            });
            document.getElementById("logoutModal").querySelector(".btn-book-nodelete").addEventListener("click", () => {
                document.getElementById("logoutModal").style.opacity = "0";
                document.getElementById("logoutModal").style.pointerEvents = "none";
            });
            document.getElementById("logoutModal").querySelector(".btn-book-delete-booking").addEventListener("click", () => {
                async function logout() {
                    try {
                        const response = await fetch(`${url}/api/logout`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                            credentials: 'include'
                        });
                        const data = await response.json(); 
                        if(data.message == "success"){
                            localStorage.clear();
                            window.location.href = gitName + "/login.html";
                        }
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                }
                logout();
            });

            /* modal click outs */
            document.querySelectorAll(".new-modal").forEach(modal => {
                modal.addEventListener("click", (e) => {
                    if(!modal.querySelector(".new-wrapper").contains(e.target)){
                        modal.style.opacity = "0";
                        modal.style.pointerEvents = "none";
                    }
                });
                modal.querySelector("i.new-xmark").addEventListener("click", () => {
                    modal.style.opacity = "0";
                    modal.style.pointerEvents = "none";
                });
            });
        }

        if(document.querySelector(".setup")){
            async function findAdmin() {
                try {
                    const response = await fetch(`${url}/api/find-admin`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                        credentials: 'include'
                    });
                    const data = await response.json(); 
                    if(data.message == "adminfound"){
                        window.location.href = gitName + "/login.html";
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
            findAdmin();

            document.getElementById("adminForm").addEventListener("submit", async (e) => {
                e.preventDefault(); 
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                const res = await fetch(url + "/api/setup", {
                    method: "POST",
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const responseData = await res.json();
                if(responseData.message == "success"){
                    localStorage.setItem("token", responseData.token);
                    if(isMobile && window.innerWidth < 1260){
                        window.location.href = gitName + "/admin.html?admin=true";
                    } else {
                        window.location.href = gitName + "/dashboard.html?admin=true";
                    }
                }
            });

            document.getElementById("photoInput").addEventListener("change", async (e) => {
                document.querySelector(".edit-upload-img img").src = URL.createObjectURL(e.target.files[0]);
                document.querySelector(".edit-upload-content").style.opacity = "0";
                setTimeout(() => {
                    document.querySelector(".edit-upload-content").style.display = "none";
                    document.querySelector(".edit-upload-img").style.display = "flex";
                    setTimeout(() => {
                        document.querySelector("i.edit-close").style.opacity = "1";
                        document.querySelector(".edit-upload-img").style.opacity = "1";
                        document.querySelector(".edit-upload-img").style.maxHeight = "600px";
                        document.querySelector(".edit-upload-img").style.marginTop = "25px";
                    }, 50);
                }, 300);

                const formData = new FormData();
                formData.append("pfp", e.target.files[0]);

                const res = await fetch(`${url}/api/upload-pfp`, {
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: formData,
                });

                const data = await res.json();
                localStorage.setItem("logo", data.url);
                console.log(data.url);
                if (data.success) {
                    console.log("PFP uploaded successfully!");
                }
            });
            document.querySelector(".edit-upload-btn").addEventListener("click", () => {
                document.getElementById("photoInput").click();
            });
        }

        if(document.querySelector(".login")){
            async function findAdmin() {
                try {
                    const response = await fetch(`${url}/api/find-admin`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                        credentials: 'include'
                    });
                    const data = await response.json(); 
                    if(data.message == "noadmin"){
                        window.location.href = gitName + "/setup.html";
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
            findAdmin();

            document.getElementById("logForm").addEventListener("submit", async (e) => {
                e.preventDefault(); 
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                const res = await fetch(url + "/api/login", {
                    method: "POST",
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const responseData = await res.json();
                if(responseData.message == "no user"){
                    document.getElementById("emailError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("emailError").style.display = "none";
                    }, 2000);
                } else if(responseData.message == "invalid password"){
                    document.getElementById("passwordError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("passwordError").style.display = "none";
                    }, 2000);
                } else if(responseData.message == "failure"){
                    document.getElementById("serverError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("serverError").style.display = "none";
                    }, 2000);
                } else if(responseData.message == "success") {
                    localStorage.setItem("token", responseData.token);
                    window.location.href = gitName + "/";
                } else if(responseData.message == "admin") {
                    localStorage.setItem("token", responseData.token);
                    if(isMobile && window.innerWidth < 1260){
                        window.location.href = gitName + "/admin.html?admin=true";
                    } else {
                        window.location.href = gitName + "/dashboard.html?admin=true";
                    }
                }
            });

            document.getElementById("resetPassword").addEventListener("click", () => {
                document.getElementById("logForm").style.opacity = "0";
                setTimeout(() => {
                    document.getElementById("logForm").style.display = "none";
                    document.getElementById("sendForm").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("sendForm").style.opacity = "1";
                    }, 30);
                }, 200);
            });
            document.getElementById("sendForm").addEventListener("submit", async (e) => {
                e.preventDefault(); 
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                const res = await fetch(url + "/api/send-code", {
                    method: "POST",
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const responseData = await res.json();
                if(responseData.message == "success") {
                    document.getElementById("sendForm").style.opacity = "0";
                    setTimeout(() => {
                        document.getElementById("sendForm").style.display = "none";
                        document.getElementById("verForm").style.display = "block";
                        setTimeout(() => {
                            document.getElementById("verForm").style.opacity = "1";
                        }, 30);
                    }, 200);
                } else if(responseData.message == "noemail") {
                    document.getElementById("sendError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("sendError").style.display = "none";
                    }, 2000);
                }
            });

            document.getElementById("verForm").addEventListener("submit", async (e) => {
                e.preventDefault(); 
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                const res = await fetch(url + "/api/verify", {
                    method: "POST",
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const responseData = await res.json();
                if(responseData.message == "success") {
                    localStorage.setItem("token", responseData.token);
                    window.location.href = gitName + "/";
                } else if(responseData.message == "codeerror") {
                    document.getElementById("codeError").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("codeError").style.display = "none";
                    }, 2000);
                }
            });
        }

        if(params.get("admin")){
            if(!userData || userData.perms != "admin") window.location.href = gitName + "/";
            if(document.querySelector(".home-name") && userData) document.querySelector(".home-name").textContent = userData.name;

            async function getAdminData(){
                try {
                    let data = {}
                    try {
                        const response = await fetch(`${url}/api/admin-data`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                            credentials: 'include'
                        });
                        data = await response.json(); 
                    } catch(err){
                        data.jobs = JSON.parse(localStorage.getItem("jobs"));
                        data.users = JSON.parse(localStorage.getItem("users"));
                        data.prices = JSON.parse(localStorage.getItem("prices"));
                    }

                    localStorage.setItem("jobs", JSON.stringify(data.jobs));
                    localStorage.setItem("users", JSON.stringify(data.users));
                    localStorage.setItem("prices", JSON.stringify(data.prices));
                    let jobs = sortChronologically(data.jobs);
                    let workers = data.users;
                    let prices = data.prices;

                    async function publishOfflineData(){
                        if(navigator.onLine && url == ""){
                            if(localStorage.getItem("pendingJobs") && localStorage.getItem("pendingJobs").includes("[")){
                                let pendingJobs = JSON.parse(localStorage.getItem("pendingJobs"));
                                for(data of pendingJobs){
                                    try {
                                        await fetch(url + "/api/create-job", {
                                            method: "POST",
                                            credentials: 'include',
                                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                            body: JSON.stringify(data)
                                        });
                                    } catch(err){
                                        console.error(err);
                                    }
                                }
                            }

                            if(localStorage.getItem("pendingWorkers") && localStorage.getItem("pendingWorkers").includes("[")){
                                let pendingWorkers = JSON.parse(localStorage.getItem("pendingWorkers"));
                                for(data of pendingWorkers){
                                    try {
                                        await fetch(url + "/api/create-worker", {
                                            method: "POST",
                                            credentials: 'include',
                                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                            body: JSON.stringify(data)
                                        });
                                    } catch(err){
                                        console.error(err);
                                    }
                                }
                            }
    
                            localStorage.setItem("pendingJobs", undefined);
                            localStorage.setItem("pendingWorkers", undefined);
                        }
                    }
                    publishOfflineData();
                    
                    if(document.querySelector(".admin")){
                        function showNoJobs(){
                            document.querySelector(".admin-table-scroll").style.display = "none";
                            document.getElementById("jobEmpty").style.display = "block";
                        }
                        let validJobs = 0;
                        jobs.forEach(job => {
                            let newRow = document.createElement("div");
                            newRow.classList.add("admin-table-row");
                            newRow.id = job.id;

                            let statusClass = "pending";
                            let reportIcon = "";
                            validJobs++;
                            if(job.job_status == "In Progress"){
                                statusClass = "active";
                            } else if(job.job_status == "Completed"){
                                let allowedDates = [];
                                for(let i = -7; i < 7; i++){
                                    allowedDates.push(getSpecificDate(i));
                                }
                                if(!allowedDates.includes(job.job_date)){
                                    validJobs--;
                                    newRow.style.display = "none";
                                }
                                reportIcon = '<i class="fa-solid fa-chart-line admin-report-icon"></i>';
                                statusClass = "completed";
                            }
                            let materialHtml = '<div class="admin-material-btn">View Materials</div>';
                            if(job.job_materials == "No materials used") materialHtml = "No materials yet";
                            let notesSpan = "";
                            if(job.job_notes == "No notes yet." || job.job_notes.length < 23) notesSpan = "style='display: none;'"
                            newRow.innerHTML = `
                                <div class="admin-table-txt">${job.job_date.slice(0, 5)} - ${job.job_time}</div>
                                <div class="admin-table-txt fow500">${job.job_customer}</div>
                                <div class="admin-table-txt">${job.job_address}</div>
                                <div class="admin-table-txt">${job.job_worker}</div>
                                <div class="admin-table-txt">
                                    <div class="admin-table-status admin-status-${statusClass}">${job.job_status}</div>
                                </div>
                                <div class="admin-table-icon">
                                    <i class="fa-regular fa-pen-to-square admin-edit-icon"></i>
                                    <i class="fa-regular fa-trash-can admin-delete-icon"></i>
                                    ${reportIcon}
                                </div>
                                <div class="admin-table-txt">${job.job_progress}</div>
                                <div class="admin-table-txt admin-material-element">
                                    ${materialHtml}
                                </div>
                                <div class="admin-table-txt">
                                    <div class="admin-table-notes">${job.job_notes.slice(0, 23)}...<br><span ${notesSpan}>Read more</span></div>
                                </div>
                            `;
                            document.querySelector(".admin-table-col").appendChild(newRow);
                        });
                        if(validJobs == 0){
                            showNoJobs();
                        }

                        document.querySelector("#adminJobForm .jobdateinput").value = todayDate;

                        document.querySelector(".admin-table-btn").addEventListener("click", () => {
                            document.getElementById("calModal").style.left = "0px";
                            document.getElementById("calModal").style.opacity = "1";
                            document.getElementById("calModal").style.pointerEvents = "auto";

                            document.querySelectorAll(".edit-mat-option").forEach(option => {
                                option.classList.remove("edit-mat-active");
                            });
                        });

                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.querySelector("i.new-xmark").addEventListener("click", () => {
                                modal.style.opacity = "0";
                                modal.style.pointerEvents = "none";
                            });
                        });

                        let currentFilters = ["", ""];
                        document.querySelectorAll(".exam-modal-section").forEach(section => {
                            section.querySelectorAll(".exam-modal-box").forEach((box, idx) => {
                                box.addEventListener("click", () => {
                                    section.querySelectorAll(".exam-modal-box").forEach((other, otherIdx) => {
                                        if(otherIdx == idx && !box.classList.contains("exam-modal-box-active")){
                                            box.classList.add("exam-modal-box-active");
                                            box.querySelector("i").classList.add("exam-modal-check-active");
                                        } else {
                                            other.classList.remove("exam-modal-box-active");
                                            other.querySelector("i").classList.remove("exam-modal-check-active");
                                        }
                                    });
                                });
                            });
                        });
                        document.getElementById("saveFilterBtn").addEventListener("click", () => {
                            document.querySelectorAll(".exam-modal-section").forEach((section, idx) => {
                                section.querySelectorAll(".exam-modal-box").forEach((box, boxIdx) => {
                                    if(box.classList.contains("exam-modal-box-active")){
                                        currentFilters[idx] = boxIdx;
                                    }
                                });
                                if(!section.querySelector(".exam-modal-box-active")){
                                    currentFilters[idx] = "";
                                }
                            });

                            let validJobs = 0;
                            jobs.forEach(job => {
                                let jobRow = document.getElementById(job.id);
                                let invalid = false;
                                if(currentFilters[0] === 0){
                                    if(job.job_status == "Pending"){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[0] == 1){
                                    if(job.job_status == "In Progress"){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[0] == 2){
                                    if(job.job_status == "Completed"){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[0] == ""){
                                    jobRow.style.display = "flex";
                                }

                                if(currentFilters[1] === 0){
                                    if(job.job_date == todayDate){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[1] == 1){
                                    if(job.job_date.slice(3, 5) == todayDate.slice(3, 5)){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[1] == 2){
                                    if(job.job_date.slice(6) == todayDate.slice(6)){
                                        jobRow.style.display = "flex";
                                    } else {
                                        invalid = true;
                                    }
                                } else if(currentFilters[1] == ""){
                                    jobRow.style.display = "flex";
                                }

                                if(invalid){
                                    jobRow.style.display = "none";
                                } else {
                                    validJobs++;
                                }
                            });
                            if(validJobs == 0){
                                showNoJobs();
                            } else {
                                document.querySelector(".admin-table-scroll").style.display = "block";
                                document.getElementById("jobEmpty").style.display = "none";
                            }
                            document.querySelector(".exam-modal").style.opacity = "0";
                            document.querySelector(".exam-modal").style.pointerEvents = "none";
                        });

                        document.getElementById("adminHolder").querySelector(".admin-filter-btn").addEventListener("click", () => {
                            document.querySelector(".exam-modal").style.opacity = "1";
                            document.querySelector(".exam-modal").style.pointerEvents = "auto";
                        });
                        document.getElementById("adminHolder").querySelector("i.exam-modal-close").addEventListener("click", () => {
                            document.querySelector(".exam-modal").style.opacity = "0";
                            document.querySelector(".exam-modal").style.pointerEvents = "none";
                        });

                        document.getElementById("adminHolder").querySelectorAll(".admin-table-notes span").forEach((span, idx) => {
                            span.addEventListener("click", () => {
                                document.querySelector(".read-wrapper div").textContent = jobs[idx].job_notes;
                                document.querySelector(".read-modal").style.opacity = "1";
                                document.querySelector(".read-modal").style.pointerEvents = "auto";
                            });
                        });
                        document.getElementById("adminHolder").querySelector("i.read-close").addEventListener("click", () => {
                            document.querySelector(".read-modal").style.opacity = "0";
                            document.querySelector(".read-modal").style.pointerEvents = "none";
                        });

                        document.getElementById("adminHolder").querySelectorAll("i.admin-edit-icon").forEach((icon, idx) => {
                            icon.addEventListener("click", () => {
                                let editJob = jobs[idx];
                                document.getElementById("editName").value = editJob.job_name;
                                document.getElementById("editCustomerName").value = editJob.job_customer;
                                document.getElementById("editCustomerAddress").value = editJob.job_address;
                                document.querySelector("#editDateSelector div").textContent = editJob.job_date.slice(0, 2) + " " + months[Number(editJob.job_date.slice(3, 5)) - 1] + " " + editJob.job_date.slice(-4);
                                if(document.querySelector("#editDateSelector div").textContent.slice(0, 1) == "") document.querySelector("#editDateSelector div").textContent = document.querySelector("#editDateSelector div").textContent.slice(1);
                                document.getElementById("editDateInput").value = editJob.job_date;
                                document.getElementById("editCost").value = editJob.job_cost;
                                document.getElementById("editTime").value = editJob.job_time;
                                document.querySelector("#editWorkerSelector div").textContent = editJob.job_worker;
                                document.getElementById("editWorkerInput").value = editJob.job_worker;
                                document.getElementById("editIdInput").value = editJob.user_id;
                                document.querySelectorAll(".edit-mat-option").forEach(option => {
                                    if(option.id == editJob.user_id){
                                        option.classList.add("edit-mat-active");
                                    }
                                });
                                document.getElementById("jobId").value = editJob.id;

                                document.getElementById("editJobModal").style.opacity = "1";
                                document.getElementById("editJobModal").style.pointerEvents = "auto";
                            });
                        });
                        let deleteId;
                        document.getElementById("adminHolder").querySelectorAll("i.admin-delete-icon").forEach((icon, idx) => {
                            icon.addEventListener("click", () => {
                                document.getElementById("deleteJob").style.opacity = "1";
                                document.getElementById("deleteJob").style.pointerEvents = "auto";
                                deleteId = jobs[idx].id;
                            });
                        });
                        document.getElementById("adminHolder").querySelectorAll(".admin-table-icon").forEach((group, idx) => {
                            group.querySelectorAll("i.admin-report-icon").forEach((icon) => {
                                icon.addEventListener("click", () => {
                                    jobId = jobs[idx].id;
                                    makeJobReport(jobs[idx]);
                                    changePage(3);
                                    setTimeout(() => {
                                        document.getElementById("jobReportCol").scrollIntoView({
                                            behavior: "smooth",
                                        });
                                    }, 100);
                                });
                            });
                        });
                        function makeJobReport(job){
                            let totalCharges = 2;
                            let chargePrice;
                            if(job.job_charges == "No charges"){
                                totalCharges = 0;
                                chargePrice = "£0";
                            } else {
                                job.job_charges.split("").forEach(letter => {
                                    if(letter == ","){
                                        totalCharges++;
                                    }
                                });
                                if(job.job_charges.includes("£")) totalCharges = 0;
                                totalCharges = totalCharges / 2;
                                chargePrice = "£" + Number(Number(job.job_realcharge.replace("£", "")) - Number(job.labour_charge.replace("£", "")) - Number(job.material_charge.replace("£", "")));
                            }
                            let labourDesc = job.job_progress;
                            if(!labourDesc.includes("hrs")) labourDesc = "call out fee";
                            let jobProfit = Number(job.job_realcharge.replace("£", "")) - Number(job.job_setback.replace("£", ""));
                            let trendImg;
                            let trendTxt;
    
                            let avgProfit = 0;
                            let usedDates = [];
                            jobs.forEach(other => {if(other.job_status == "Completed"){
                                if(other.id != job.id){
                                    if(!usedDates.includes(other.job_date)){
                                        usedDates.push(other.job_date);
                                    }
                                    avgProfit += Number(other.job_realcharge.replace(/£/g, "")) - Number(other.job_setback.replace(/£/g, ""));
                                }
                            }});
                            avgProfit = avgProfit / usedDates.length || 0;
    
                            if(jobProfit >= avgProfit){
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `+${percent}% from average day`;
                                trendImg = "uptrend";
                            } else {
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `${percent}% from average day`;
                                trendImg = "downtrend";
                            }
                            if(jobProfit == 0){
                                trendTxt = `No profit earned`;
                                trendImg = "downtrend";
                            } else if(jobProfit > 0 && avgProfit == 0){
                                trendTxt = `Total profit earned`;
                                trendImg = "uptrend";
                            }
                            document.querySelector(".rep-job-wrapper").innerHTML = `
                                <div class="rep-job-name">${job.job_name}</div>
                                <div class="rep-job-date">Completed ${job.job_date}</div>
                                <div class="rep-circ-container">
                                    <div class="rep-circ circ-fill" id="circLabour"></div>
                                    <div class="rep-circ circ-fill" id="circMaterials"></div>
                                    <div class="rep-circ circ-fill" id="circExtra"></div>
                                    <div class="rep-circ-mid"></div>
                                    <div class="rep-circ-content">
                                        <div class="rep-circ-head">${job.job_setback}</div>
                                        <div class="rep-circ-txt">Total Cost</div>
                                    </div>
                                </div>
                                <div class="rep-job-legend">
                                    <div><span style="background-color: hsl(211, 22%, 34%);"></span> Labour ${job.labour_cost}</div>
                                    <div><span style="background-color: hsl(211, 22%, 54%);"></span> Materials ${job.material_cost}</div>
                                </div>
    
                                <div class="rep-exp">
                                    <div class="rep-exp-top">
                                        <div class="rep-exp-head">End Charge: <span class="rep-exp-head">${job.job_realcharge}</span></div>
                                        <img src="images/icons/chevron.png" class="rep-exp-chev" />
                                    </div>
    
                                    <div class="rep-exp-drop">
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Labour Charge</div>
                                                <div class="rep-exp-txt">${labourDesc}</div>
                                            </div>
                                            <div class="rep-exp-num">${job.labour_charge}</div>
                                        </div>
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Materials Charge</div>
                                                <div class="rep-exp-txt">${job.material_cost} worth used</div>
                                            </div>
                                            <div class="rep-exp-num">${job.material_charge}</div>
                                        </div>
                                        <div class="rep-exp-section" style="padding-bottom: 5px;">
                                            <div>
                                                <div class="rep-exp-name">Extra Charges</div>
                                                <div class="rep-exp-txt">${totalCharges} charges applied</div>
                                            </div>
                                            <div class="rep-exp-num">${chargePrice}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="rep-prof">
                                    <div class="rep-prof-head"><span style="background-color: var(--primary);"></span> Job Profit</div>
                                    <div class="rep-prof-num">£${jobProfit} <img src="images/icons/${trendImg}.png" /></div>
                                    <div class="rep-prof-txt">${trendTxt}</div>
                                </div>
                            `;
                            let labourPercent = 360 * (Number(job.labour_cost.replace("£", "")) / Number(job.job_setback.replace("£", "")));
                            document.getElementById("circLabour").style.background = `
                                conic-gradient(
                                    from 0deg,
                                    hsl(211, 22%, 34%) 0deg ${labourPercent}deg,
                                    transparent ${labourPercent + 0.5}deg  360deg 
                                )
                            `;
                            document.querySelector(".rep-exp").addEventListener("click", () => {
                                if(document.querySelector(".rep-exp-chev").style.transform == "rotate(90deg)"){
                                    document.querySelector(".rep-exp-drop").style.opacity = "0";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "0px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "0px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(0deg)";
                                } else {
                                    document.querySelector(".rep-exp-drop").style.opacity = "1";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "25px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "200px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(90deg)";
                                }
                            });
                        }

                        document.querySelector(".btn-book-delete-booking").addEventListener("click", () => {
                            async function deleteJob() {
                                const dataToSend = { jobId: deleteId };
                                try {
                                    const response = await fetch(url + '/api/delete-job', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            'Content-Type': 'application/json', 
                                        },
                                        body: JSON.stringify(dataToSend), 
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Error:', errorData.message);
                                        return;
                                    }

                                    const data = await response.json();
                                    if(data.message == "success"){
                                        document.getElementById("deleteJob").style.opacity = "0";
                                        document.getElementById("deleteJob").style.pointerEvents = "none";
                                        setTimeout(() => {
                                            document.getElementById("thankDelete").style.opacity = "1";
                                            document.getElementById("thankDelete").style.pointerEvents = "auto";
                                            document.getElementById("thankDelete").querySelector(".thank-wrapper").style.opacity = "1";
                                            document.getElementById("thankDelete").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                        }, 300);
                                    }
                                } catch (error) {
                                    console.error('Error posting data:', error);
                                }
                            }
                            deleteJob();
                        });

                        document.querySelectorAll(".admin-material-element").forEach((el, idx) => {
                            if(el.querySelector(".admin-material-btn")){
                                el.querySelector(".admin-material-btn").addEventListener("click", () => {
                                    document.querySelector(".mat-col").innerHTML = "";
                                    let matJob = jobs[idx];
                                    let jobMaterials = matJob.job_materials.split(",,");
                                    jobMaterials.forEach(mat => {
                                        let matRow;
                                        prices.forEach(row => {
                                            if(row.area == "materials"){
                                                if(mat.split("-")[0] == row.name){
                                                    matRow = row;
                                                }
                                            }
                                        });
                                        if(matRow){
                                            let newWrapper = document.createElement("div");
                                            newWrapper.classList.add("mat-wrapper");
                                            newWrapper.innerHTML = `
                                                <div class="mat-amount">${mat.split("-")[1]} used</div>
                                                <div class="mat-name">${mat.split("-")[0]}</div>
                                                <div class="mat-flex">
                                                    <div class="mat-cost">Cost: <span>£${matRow.cost}</span></div>
                                                    <div class="mat-cost">Charged: <span>£${matRow.charge}</span></div>
                                                </div>
                                            `;
                                            document.querySelector(".mat-col").appendChild(newWrapper);
                                        }
                                    });

                                    document.getElementById("materialsModal").style.opacity = "1";
                                    document.getElementById("materialsModal").style.pointerEvents = "auto";
                                });
                            }
                        });

                        document.querySelectorAll(".edit-mat-option").forEach(option => {
                            option.addEventListener("click", () => {
                                let disable = false;
                                if(option.classList.contains("edit-mat-active")){
                                    disable = true;
                                }
                                document.querySelectorAll(".edit-mat-option").forEach(other => {
                                    other.classList.remove("edit-mat-active");
                                });
                                if(!disable){
                                    option.classList.add("edit-mat-active");
                                    if(document.getElementById("adminJobModal").style.opacity == "1"){
                                        document.querySelector("#workerSelector div").textContent = option.innerHTML.slice(0, option.innerHTML.indexOf("<"));
                                        document.getElementById("workerInput").value = document.querySelector("#workerSelector div").textContent;
                                        document.getElementById("idInput").value = option.id;
                                    } else {
                                        document.querySelector("#editWorkerSelector div").textContent = option.innerHTML.slice(0, option.innerHTML.indexOf("<"));
                                        document.getElementById("editWorkerInput").value = document.querySelector("#editWorkerSelector div").textContent;
                                        document.getElementById("editIdInput").value = option.id;
                                    }
                                } else {
                                    option.classList.remove("edit-mat-active");
                                    if(document.getElementById("adminJobModal").style.opacity == "1"){
                                        document.querySelector("#workerSelector div").textContent = "Select Worker";
                                        document.getElementById("workerInput").value = "";
                                        document.getElementById("idInput").value = "";
                                    } else {
                                        document.querySelector("#editWorkerSelector div").textContent = "Select Worker";
                                        document.getElementById("editWorkerInput").value = "";
                                        document.getElementById("editIdInput").value = "";
                                    }
                                }
                            });
                        });

                        document.getElementById("editJobForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            const res = await fetch(url + "/api/edit-job", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "noworker"){
                                document.getElementById("editWorkerError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("editWorkerError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                document.getElementById("editJobModal").style.opacity = "0";
                                document.getElementById("editJobModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankJobEdit").style.opacity = "1";
                                    document.getElementById("thankJobEdit").style.pointerEvents = "auto";
                                    document.getElementById("thankJobEdit").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankJobEdit").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });

                        function calcProfits(time){
                            let todayRevenue = 0;
                            let averageRevenue = 0;
                            let todayLabour = 0;
                            let averageLabour = 0;
                            let todayMaterial = 0;
                            let averageMaterial = 0;
                            let todayProfit = 0;
                            let averageProfit = 0;
                            if(time == "daily"){
                                let usedDates = [];
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(job.job_date == todayDate){
                                        todayRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else {
                                        if(!usedDates.includes(job.job_date)){
                                            usedDates.push(job.job_date);
                                        }
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});
                                averageRevenue = averageRevenue / usedDates.length || 0;
                                averageLabour = averageLabour / usedDates.length || 0;
                                averageMaterial = averageMaterial / usedDates.length || 0;
                                averageProfit = averageProfit / usedDates.length || 0;

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `${percent}% from average day`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `No revenue earned today`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `Total revenue earned today`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourTextAdmin").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourTextAdmin").textContent = `${percent}% from average day`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourTextAdmin").textContent = `No labour recorded today`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourTextAdmin").textContent = `Total labour today`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialTextAdmin").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialTextAdmin").textContent = `${percent}% from average day`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialTextAdmin").textContent = `No materials used today`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialTextAdmin").textContent = `Total materials used today`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitTextAdmin").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitTextAdmin").textContent = `${percent}% from average day`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitTextAdmin").textContent = `No profit today`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitTextAdmin").textContent = `Total profit today`;
                                }
                            } else if(time == "weekly"){
                                let currentDates = [];
                                let pastDates = [];
                                for(let i = 0; i < 14; i++){
                                    if(i > 6){
                                        pastDates.push(getSpecificDate(i));
                                    } else {
                                        currentDates.push(getSpecificDate(i));
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `${percent}% from average week`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `No revenue this week`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `Total revenue this week`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourTextAdmin").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourTextAdmin").textContent = `${percent}% from average week`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourTextAdmin").textContent = `No labour this week`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNumAdmin").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourTextAdmin").textContent = `Total labour this week`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialTextAdmin").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialTextAdmin").textContent = `${percent}% from average week`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialTextAdmin").textContent = `No materials this week`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNumAdmin").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialTextAdmin").textContent = `Total materials this week`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitTextAdmin").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitTextAdmin").textContent = `${percent}% from average week`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitTextAdmin").textContent = `No profit this week`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNumAdmin").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitTextAdmin").textContent = `Total profit this week`;
                                }
                            } else if(time == "monthly"){
                                let currentDates = [];
                                let pastDates = [];
                                let gotFirstMonth = false;
                                for(let i = 0; i < 70; i++){
                                    let newDate = getSpecificDate(i);

                                    if(!gotFirstMonth){
                                        currentDates.push(newDate);
                                    } else {
                                        pastDates.push(newDate);
                                    }

                                    if(newDate.slice(0, 2) == "01"){
                                        if(gotFirstMonth) break;

                                        gotFirstMonth = true;
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueTextAdmin").textContent = `${percent}% from average month`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `No revenue this month`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNumAdmin").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueTextAdmin").textContent = `Total revenue this month`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average month`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour this month`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour this month`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average month`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials this month`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials this month`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average month`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit this month`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit this month`;
                                }
                            }
                        }
                        calcProfits("weekly");


                        /* modal click outs */
                        document.addEventListener("click", (e) => {
                            if(!document.querySelector(".exam-modal-wrapper").contains(e.target) && !document.querySelector(".admin-filter-btn").contains(e.target)){
                                document.querySelector(".exam-modal").style.opacity = "0";
                                document.querySelector(".exam-modal").style.pointerEvents = "none";
                            }

                            let notClicked = true;
                            document.querySelectorAll(".admin-table-notes span").forEach(span => {
                                if(span.contains(e.target)) notClicked = false;
                            });
                            if(notClicked){
                                document.querySelector(".read-modal").style.opacity = "0";
                                document.querySelector(".read-modal").style.pointerEvents = "none";
                            }
                        });
                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.addEventListener("click", (e) => {
                                if(!modal.querySelector(".new-wrapper").contains(e.target)){
                                    modal.style.opacity = "0";
                                    modal.style.pointerEvents = "none";
                                }
                            });
                        });
                        document.getElementById("deleteJob").addEventListener("click", (e) => {
                            if(!document.querySelector(".book-delete-wrapper").contains(e.target)){   
                                document.getElementById("deleteJob").style.opacity = "0";
                                document.getElementById("deleteJob").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector(".btn-book-nodelete").addEventListener("click", () => {
                            document.getElementById("deleteJob").style.opacity = "0";
                            document.getElementById("deleteJob").style.pointerEvents = "none";
                        });
                        document.querySelector(".assign-modal").addEventListener("click", (e) => {
                            if(!document.querySelector(".assign-wrapper").contains(e.target)){
                                document.querySelector(".assign-modal").style.opacity = "0";
                                document.querySelector(".assign-modal").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("i.assign-close").addEventListener("click", () => {
                            document.querySelector(".assign-modal").style.opacity = "0";
                            document.querySelector(".assign-modal").style.pointerEvents = "none";
                        });
                    }

                    if(document.querySelector(".admin") || document.querySelector(".workers")){
                        currentPage.querySelector(".jobdateinput").value = todayDate;

                        document.querySelectorAll(".new-date-selector").forEach(selector => {
                            selector.addEventListener("click", () => {
                                currentPage.querySelector(".date-modal").style.opacity = "1";
                                currentPage.querySelector(".date-modal").style.pointerEvents = "auto";
                            });

                            currentPage.querySelectorAll(".edit-change-col").forEach((col, colIdx) => {
                                col.querySelector(".edit-change-num").textContent = todayDate.split("/")[colIdx];
                                if(col.querySelector(".edit-change-num").textContent.length == 4) col.querySelector(".edit-change-num").textContent = col.querySelector(".edit-change-num").textContent.slice(2);
                            });
                        });
                        document.querySelectorAll(".date-modal").forEach(flex => {
                            flex.querySelectorAll(".edit-change-col").forEach((col, colIdx) => {
                                col.querySelectorAll(".edit-change-chev").forEach((chev, idx) => {
                                    chev.addEventListener("click", () => {
                                        if(idx == 0){
                                            col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) + 1;
                                            if(Number(col.querySelector(".edit-change-num").textContent) > 31 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "1";
                                            if(Number(col.querySelector(".edit-change-num").textContent) > 12 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "1";
                                            if(Number(col.querySelector(".edit-change-num").textContent) < 25 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "25";
                                        } else {
                                            col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) - 1;
                                            if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "31";
                                            if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "12";
                                            if(Number(col.querySelector(".edit-change-num").textContent) < 10 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "10";
                                        }
                                    });
                                });
    
                                col.querySelector(".edit-change-num").textContent = todayDate.split("/")[colIdx];
                                if(col.querySelector(".edit-change-num").textContent.length == 4) col.querySelector(".edit-change-num").textContent = col.querySelector(".edit-change-num").textContent.slice(2);
                            });
                            flex.querySelector(".btn-change-save").addEventListener("click", () => {
                                currentPage.querySelector(".date-modal").style.opacity = "0";
                                currentPage.querySelector(".date-modal").style.pointerEvents = "none";
    
                                let day = document.querySelectorAll(".edit-change-num")[0].textContent;
                                if(day.length == 1) day = "0" + day;
                                let month = document.querySelectorAll(".edit-change-num")[1].textContent;
                                if(month.length == 1) month = "0" + month;
                                if(currentPage.querySelector("#adminJobModal, #workerJobModal").style.opacity == "1"){
                                    document.querySelector("#jobDateSelector div").textContent = document.querySelectorAll(".edit-change-num")[0].textContent + " " + months[Number(document.querySelectorAll(".edit-change-num")[1].textContent - 1)] + " 20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                    document.getElementById("jobDateInput").value = day + "/" + month + "/20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                } else {
                                    document.querySelector("#editDateSelector div").textContent = document.querySelectorAll(".edit-change-num")[0].textContent + " " + months[Number(document.querySelectorAll(".edit-change-num")[1].textContent - 1)] + " 20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                    document.getElementById("editDateInput").value = day + "/" + month + "/20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                }
                            });
                            flex.querySelector(".btn-change-cancel").addEventListener("click", () => {
                                currentPage.querySelector(".date-modal").style.opacity = "0";
                                currentPage.querySelector(".date-modal").style.pointerEvents = "none";
                            });
                        });


                        document.querySelector("#adminJobForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            let responseData = {};
                            try {
                                const res = await fetch(url + "/api/create-job", {
                                    method: "POST",
                                    credentials: 'include',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                    body: JSON.stringify(data)
                                });
    
                                responseData = await res.json();
                            } catch(err){
                                let pendingJobs = [];
                                if(localStorage.getItem("pendingJobs") && localStorage.getItem("pendingJobs").includes("[")){
                                    pendingJobs = JSON.parse(localStorage.getItem("pendingJobs"));
                                }
                                pendingJobs.push(data);
                                localStorage.setItem("pendingJobs", JSON.stringify(pendingJobs));
                                responseData.message = "success";
                            }

                            if(responseData.message == "noworker"){
                                document.getElementById("workerError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("workerError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                currentPage.querySelector("#adminJobModal, #workerJobModal").style.opacity = "0";
                                currentPage.querySelector("#adminJobModal, #workerJobModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankJobCreation").style.opacity = "1";
                                    document.getElementById("thankJobCreation").style.pointerEvents = "auto";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });
                        document.querySelector("#workerJobForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            let responseData = {};
                            try {
                                const res = await fetch(url + "/api/create-job", {
                                    method: "POST",
                                    credentials: 'include',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                    body: JSON.stringify(data)
                                });

                                responseData = await res.json();
                            } catch(err){
                                let pendingJobs = [];
                                if(localStorage.getItem("pendingJobs") && localStorage.getItem("pendingJobs").includes("[")){
                                    pendingJobs = JSON.parse(localStorage.getItem("pendingJobs"));
                                }
                                pendingJobs.push(data);
                                localStorage.setItem("pendingJobs", JSON.stringify(pendingJobs));
                                responseData.message = "success";
                            }

                            if(responseData.message == "noworker"){
                                document.getElementById("workerError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("workerError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                currentPage.querySelector("#adminJobModal, #workerJobModal").style.opacity = "0";
                                currentPage.querySelector("#adminJobModal, #workerJobModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankJobCreation").style.opacity = "1";
                                    document.getElementById("thankJobCreation").style.pointerEvents = "auto";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });

                        /* MODAL CLICK OUTS */
                        document.querySelectorAll(".date-modal")[0].addEventListener("click", (e) => {
                            if(!document.querySelector(".new-change").contains(e.target)){
                                document.querySelector(".date-modal").style.opacity = "0";
                                document.querySelector(".date-modal").style.pointerEvents = "none";
                            }
                        });
                        document.querySelectorAll(".date-modal")[1].addEventListener("click", (e) => {
                            if(!document.querySelector(".new-change").contains(e.target)){
                                document.querySelector(".date-modal").style.opacity = "0";
                                document.querySelector(".date-modal").style.pointerEvents = "none";
                            }
                        });
                    }

                    if(document.querySelector(".workers")){
                        let deleteWokerId;
                        workers.forEach(worker => {
                            let newWrapper = document.createElement("div");
                            newWrapper.classList.add("work-wrapper");
                            newWrapper.id = "worker-" + worker.id;

                            let nextJob = "None upcoming";
                            let jobStyle = "style='display: none;'";
                            let jobHtml = "";
                            let matchCount = 0;
                            let colours = ["48", "68", "88"];
                            let reportBtn = "";
                            let reportBtnJob;
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && matchCount < 3 && isDateFuture(todayDate, job.job_date) && job.job_status != "Completed"){
                                    matchCount++;
                                    if(matchCount == 1) nextJob = job.job_date + " - " + job.job_time;
                                    jobStyle = "";
                                    let newHtml = `
                                        <div class="work-up-li">
                                            <span style="background-color: hsl(211, 22%, ${colours[matchCount - 1]}%);"></span>
                                            <div class="work-up-flex">
                                                <div class="work-up-left">
                                                    <div class="work-up-name">${job.job_name}</div>
                                                    <div class="work-up-btn blue-hover">View Details</div>
                                                </div>
                                                <div class="work-up-date">${job.job_date}</div>
                                            </div>
                                        </div>
                                    `;
                                    jobHtml += newHtml;
                                }

                                if(job.user_id == worker.id && job.job_status == "Completed"){
                                    reportBtn = `<div class="work-btn work-report-btn">View Report</div>`;
                                    reportBtnJob = job;
                                }
                            });

                            newWrapper.innerHTML = `
                                <i class="fa-regular fa-trash-can work-delete"></i>
                                <div class="work-top">
                                    <div class="work-pfp"><i class="fa-solid fa-user"></i></div>
                                    <div>
                                        <div class="work-name">${worker.name}</div>
                                        <div class="work-role">${worker.role}</div>
                                    </div>
                                </div>

                                <div class="work-ul">
                                    <div class="work-li">
                                        <div class="work-label">Phone</div>
                                        <div class="work-txt">${worker.phone}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Email</div>
                                        <div class="work-txt">${worker.email}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Next Job</div>
                                        <div class="work-txt">${nextJob}</div>
                                    </div>
                                </div>

                                <div class="work-up-col" ${jobStyle}>
                                    <div class="work-up-head">Upcoming Jobs</div>
                                    <div class="work-up-ul">
                                        ${jobHtml}
                                    </div>
                                </div>

                                <div class="work-btn-flex">
                                    <div class="work-btn work-rate-btn">Edit Rate</div>
                                    ${reportBtn}
                                </div>
                            `;

                            document.querySelector(".work-col").appendChild(newWrapper);

                            newWrapper.querySelector(".work-rate-btn").addEventListener("click", () => {
                                document.getElementById("newRateModal").style.opacity = "1";
                                document.getElementById("newRateModal").style.pointerEvents = "auto";
                            });
                            document.getElementById("newRateBtn").addEventListener("click", () => {
                                if(document.getElementById("newRateCharge").value == "" || document.getElementById("newRateCost").value == ""){
                                    document.getElementById("newRateError").style.display = "block";
                                    setTimeout(() => {
                                        document.getElementById("newRateError").style.display = "none";
                                    }, 2000);
                                } else {
                                    async function newRate() {
                                        const dataToSend = { charge: document.getElementById("newRateCharge").value.replace("£", ""), cost: document.getElementById("newRateCost").value.replace("£", ""), id: worker.id };
                                        try {
                                            const response = await fetch(url + '/api/new-rate', {
                                                method: 'POST',
                                                credentials: 'include',
                                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                    'Content-Type': 'application/json', 
                                                },
                                                body: JSON.stringify(dataToSend), 
                                            });
        
                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                console.error('Error:', errorData.message);
                                                return;
                                            }
        
                                            const data = await response.json();
                                            if(data.message == "success"){
                                                document.getElementById("newRateModal").style.opacity = "0";
                                                document.getElementById("newRateModal").style.pointerEvents = "none";
                                                setTimeout(() => {
                                                    document.getElementById("thankPrice").style.opacity = "1";
                                                    document.getElementById("thankPrice").style.pointerEvents = "auto";
                                                    document.getElementById("thankPrice").querySelector(".thank-wrapper").style.opacity = "1";
                                                    document.getElementById("thankPrice").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                                }, 300);
                                            }
                                        } catch (error) {
                                            console.error('Error posting data:', error);
                                        }
                                    }
                                    newRate();
                                }
                            });

                            if(newWrapper.querySelector(".work-report-btn")){
                                newWrapper.querySelector(".work-report-btn").addEventListener("click", () => {
                                    makeWorkerReport(worker);
                                    changePage(3);
                                    setTimeout(() => {
                                        document.getElementById("workerReportCol").scrollIntoView({
                                        });
                                    }, 100);
                                });
                            }

                            newWrapper.querySelectorAll(".work-up-btn").forEach(btn => {
                                btn.addEventListener("click", () => {
                                    document.querySelectorAll(".admin-table-row").forEach(row => {
                                        if(row.id == newWrapper.id.split("-")[1]){
                                            row.style.backgroundColor = "hsla(222, 100%, 58%, 0.05)";
                                            row.style.order = "1";
                                        } else {
                                            row.style.order = "2";
                                        }
                                    });
                                    changePage(0);
                                });
                            });

                            newWrapper.querySelector("i.work-delete").addEventListener("click", () => {
                                document.getElementById("deleteWorkerModal").style.opacity = "1";
                                document.getElementById("deleteWorkerModal").style.pointerEvents = "auto";
                                deleteWokerId = worker.id;
                            });
                            document.getElementById("deleteWorkerModal").querySelector(".btn-book-delete-booking").onclick = () => {
                                async function deleteWorker() {
                                    const dataToSend = { id: deleteWokerId };
                                    try {
                                        const response = await fetch(url + '/api/delete-worker', {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                'Content-Type': 'application/json', 
                                            },
                                            body: JSON.stringify(dataToSend), 
                                        });

                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            console.error('Error:', errorData.message);
                                            return;
                                        }

                                        const data = await response.json();
                                        if(data.message == "success"){
                                            window.location.reload();
                                        }
                                    } catch (error) {
                                        console.error('Error posting data:', error);
                                    }
                                }
                                deleteWorker();
                            }

                            document.getElementById("deleteWorkerModal").addEventListener("click", (e) => {
                                if(!document.querySelector(".book-delete-wrapper").contains(e.target)){
                                    document.getElementById("deleteWorkerModal").style.opacity = "0";
                                    document.getElementById("deleteWorkerModal").style.pointerEvents = "none";
                                } 
                            });
                            document.getElementById("deleteWorkerModal").querySelector(".btn-book-nodelete").addEventListener("click", () => {
                                document.getElementById("deleteWorkerModal").style.opacity = "0";
                                document.getElementById("deleteWorkerModal").style.pointerEvents = "none";
                            });
                        });
                        if(document.getElementById("workersHolder").querySelectorAll(".work-wrapper").length == 0){
                            document.getElementById("workersHolder").querySelector("#workerEmpty").style.display = "block";
                        }

                        document.querySelector("#workSearch").addEventListener("input", () => {
                            document.querySelector("#workSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#workSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.querySelector("#workSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            let jobWrapper;
                                            document.querySelectorAll(".work-wrapper").forEach(wrapper => {
                                                if(wrapper.id.split("-")[1] == worker.id){
                                                    jobWrapper = wrapper;
                                                }
                                            });
                                            if(jobWrapper){
                                                document.getElementById("workersHolder").querySelector("#workerEmpty").style.display = "none";
                                                jobWrapper.style.display = "block";
                                                jobWrapper.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center"
                                                });
                                            }
                                            document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                            document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.querySelector("#workSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.querySelector("#workSearch").classList.add("search-selector-dropped");
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });

                        document.querySelector(".work-new-btn").addEventListener("click", () => {
                            document.getElementById("newWorkerModal").style.opacity = "1";
                            document.getElementById("newWorkerModal").style.pointerEvents = "auto";
                        });

                        document.querySelectorAll(".work-assign-btn").forEach((btn, idx) => {
                            btn.addEventListener("click", () => {
                                document.getElementById("workerJobModal").style.opacity = "1";
                                document.getElementById("workerJobModal").style.pointerEvents = "auto";
                                document.querySelector(".workerinput").value = workers[idx].name;
                                document.querySelector(".idinput").value = workers[idx].id;

                                document.querySelectorAll(".edit-mat-option").forEach(option => {
                                    option.classList.remove("edit-mat-active");
                                });
                            });
                        });

                        document.getElementById("newWorkerForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            let responseData = {};
                            try {
                                const res = await fetch(url + "/api/create-worker", {
                                    method: "POST",
                                    credentials: 'include',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                    body: JSON.stringify(data)
                                });

                                responseData = await res.json();
                            } catch(err){
                                let pendingWorkers = [];
                                if(localStorage.getItem("pendingWorkers") && localStorage.getItem("pendingWorkers").includes("[")){
                                    pendingWorkers = JSON.parse(localStorage.getItem("pendingWorkers"));
                                }
                                pendingWorkers.push(data);
                                localStorage.setItem("pendingWorkers", JSON.stringify(pendingWorkers));
                                responseData.message = "success";
                            }

                            if(responseData.message == "email taken"){
                                document.getElementById("emailError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("emailError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "invalid email"){
                                document.getElementById("invalidError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("invalidError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "failure"){
                                document.getElementById("serverError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("serverError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                document.getElementById("newWorkerModal").style.opacity = "0";
                                document.getElementById("newWorkerModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankWorkerCreation").style.opacity = "1";
                                    document.getElementById("thankWorkerCreation").style.pointerEvents = "auto";
                                    document.getElementById("thankWorkerCreation").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankWorkerCreation").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });

                        /* modal click outs */
                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.addEventListener("click", (e) => {
                                if(!modal.querySelector(".new-wrapper").contains(e.target)){
                                    modal.style.opacity = "0";
                                    modal.style.pointerEvents = "none";
                                }
                            });
                            modal.querySelector("i.new-xmark").addEventListener("click", () => {
                                modal.style.opacity = "0";
                                modal.style.pointerEvents = "none";
                            });
                        });
                        document.addEventListener("click", (e) => {
                            if(!document.querySelector("#workSearch").contains(e.target)){
                                document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("#workSearch input").addEventListener("focus", () => {
                            document.querySelector("#workSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#workSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.querySelector("#workSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            let jobWrapper;
                                            document.querySelectorAll(".work-wrapper").forEach(wrapper => {
                                                if(wrapper.id.split("-")[1] == worker.id){
                                                    jobWrapper = wrapper;
                                                }
                                            });
                                            if(jobWrapper){
                                                document.getElementById("workersHolder").querySelector("#workerEmpty").style.display = "none";
                                                jobWrapper.style.display = "block";
                                                jobWrapper.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center"
                                                });
                                            }
                                            document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                            document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.querySelector("#workSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.querySelector("#workSearch").classList.add("search-selector-dropped");
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.querySelector("#workSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#workSearch").querySelector(".search-drop").style.opacity = "0";
                                document.querySelector("#workSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                    }

                    if(document.querySelector(".pricing") || document.querySelector(".dashboard")){
                        let labourCount = 0;
                        prices.forEach(price => {
                            if(price.area == "materials"){
                                let newMaterial = document.createElement("div");
                                newMaterial.classList.add("pric-li");
                                newMaterial.id = price.type + "-" + price.id;
                                newMaterial.innerHTML = `
                                    <div class="pric-label">${price.name} <span class="pric-label" style="font-size: 12px; margin-left: 5px;">(per ${price.default_value} ${price.unit})</span></div>
                                    <div class="pric-txt">£${price.cost} <div></div> £${price.charge}</div>
                                `;
                                if(price.type != "parts") newMaterial.style.display = "none";
                                document.getElementById("materialUl").appendChild(newMaterial);
                            } else if(price.area == "charges"){
                                let newCharge = document.createElement("div");
                                newCharge.classList.add("pric-li");
                                newCharge.id = price.area + "-" + price.id;
                                newCharge.innerHTML = `
                                    <div class="pric-label">${price.name}</div>
                                    <div class="pric-txt">£${price.charge}</div>
                                `;
                                document.getElementById("chargeUl").appendChild(newCharge);
                            } else if(price.area == "labour"){
                                let newLabour = document.createElement("div");
                                newLabour.classList.add("pric-li");
                                newLabour.id = price.area + "-" + price.id;
                                let pricTxt = price.charge;
                                let type = "charge";
                                if(pricTxt == 0){
                                    type = "cost";
                                    pricTxt = price.cost;
                                } 
                                newLabour.innerHTML = `
                                    <div class="pric-label">${price.name}</div>
                                    <div class="pric-txt">£${pricTxt}</div>
                                `;
                                document.getElementById("labourUl").appendChild(newLabour);

                                document.getElementById("labourForm").querySelectorAll("input")[labourCount].value = "£" + pricTxt;
                                document.getElementById("labourForm").querySelectorAll("input")[labourCount].id = type + "-" + price.id;
                                labourCount++;
                            }
                        });
                        
                        document.getElementById("pricManageBtn").addEventListener("click", () => {
                            document.getElementById("materialModal").querySelector(".new-col").innerHTML = "";
                            document.getElementById("materialUl").querySelectorAll(".pric-li").forEach(li => {
                                if(li.style.display != "none"){
                                    let newInput = document.createElement("div");
                                    newInput.classList.add("new-section");
                                    newInput.id = "input-" + li.id.split("-")[1];
                                    newInput.innerHTML = `
                                        <div class="new-label">${li.querySelector(".pric-label").textContent} <i class="fa-regular fa-trash-can new-delete-icon"></i></div>
                                        <div class="new-inp-flex">
                                            <input required type="text" placeholder="Cost £" class="new-input" value="Cost ${li.querySelector(".pric-txt").innerHTML.slice(0, li.querySelector(".pric-txt").innerHTML.indexOf("<") - 1)}" />
                                            <input required type="text" placeholder="Charge £" class="new-input" value="Charge ${li.querySelector(".pric-txt").innerHTML.slice(li.querySelector(".pric-txt").innerHTML.lastIndexOf(">") + 1)}" />
                                        </div>
                                    `;
                                    document.getElementById("materialModal").querySelector(".new-col").appendChild(newInput);

                                    newInput.querySelector("i.new-delete-icon").addEventListener("click", () => {
                                        newInput.style.display = "none";
                                        li.style.display = "none";

                                        async function deleteCharge() {
                                            const dataToSend = { id: li.id.split("-")[1] };
                                            try {
                                                const response = await fetch(url + '/api/delete-price', {
                                                    method: 'POST',
                                                    credentials: 'include',
                                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                        'Content-Type': 'application/json', 
                                                    },
                                                    body: JSON.stringify(dataToSend), 
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    console.error('Error:', errorData.message);
                                                    return;
                                                }

                                                const data = await response.json();
                                            } catch (error) {
                                                console.error('Error posting data:', error);
                                            }
                                        }
                                        deleteCharge();
                                    });
                                }
                            });

                            document.getElementById("materialModal").querySelectorAll(".new-section")[document.getElementById("materialModal").querySelectorAll(".new-section").length - 1].querySelector(".new-inp-flex").style.marginBottom = "0px";
                            document.getElementById("materialModal").style.opacity = "1";
                            document.getElementById("materialModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("pricMatBtn").addEventListener("click", () => {
                            document.getElementById("newMaterialModal").style.opacity = "1";
                            document.getElementById("newMaterialModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("newMaterialForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            const res = await fetch(url + "/api/create-material", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "success") {
                                document.getElementById("newMaterialModal").style.opacity = "0";
                                document.getElementById("newMaterialModal").style.pointerEvents = "none";
                                document.getElementById("thankNewMaterial").style.opacity = "1";
                                document.getElementById("thankNewMaterial").style.pointerEvents = "auto";
                                document.getElementById("thankNewMaterial").querySelector(".thank-wrapper").style.opacity = "1";
                                document.getElementById("thankNewMaterial").querySelector(".thank-wrapper").style.transform = "scale(1)";
                            }
                        });
                        document.querySelectorAll(".new-pill-flex").forEach(flex => {
                            flex.querySelectorAll(".new-pill").forEach(pill => {
                                pill.addEventListener("click", () => {
                                    if(!pill.classList.contains("new-pill-active")){
                                        flex.querySelectorAll(".new-pill").forEach(other => {
                                            other.classList.remove("new-pill-active");
                                        });
                                        pill.classList.add("new-pill-active");
                                        flex.querySelector("input").value = pill.id.split("-")[1];

                                        let defaultValue = 0;
                                        if(pill.textContent.toLowerCase() == "units"){
                                            defaultValue = 1;
                                        } else if(pill.textContent.toLowerCase() == "metres"){
                                            defaultValue = 1;
                                        } else if(pill.textContent.toLowerCase() == "mm"){
                                            defaultValue = 15;
                                        } else if(pill.textContent.toLowerCase() == "g"){
                                            defaultValue = 75;
                                        } else if(pill.textContent.toLowerCase() == "kg"){
                                            defaultValue = 1;
                                        } else if(pill.textContent.toLowerCase() == "ml"){
                                            defaultValue = 250;
                                        }
                                        if(defaultValue != 0){
                                            document.querySelectorAll(".new-material-per").forEach(txt => {
                                                txt.textContent = `(per ${defaultValue} ${pill.textContent.toLowerCase()})`;
                                            });
                                        }
                                    }
                                });
                            });
                        });

                        document.getElementById("pricMaterialSelector").addEventListener("click", () => {
                            if(document.querySelector("#pricMaterialSelector img").style.transform == "rotate(90deg)"){
                                document.querySelector("#pricMaterialSelector img").style.transform = "rotate(0deg)";
                                document.querySelector(".pric-drop").style.opacity = "0";
                                document.querySelector(".pric-drop").style.pointerEvents = "none";
                            } else {
                                document.querySelector("#pricMaterialSelector img").style.transform = "rotate(90deg)";
                                document.querySelector(".pric-drop").style.opacity = "1";
                                document.querySelector(".pric-drop").style.pointerEvents = "auto";
                            }
                        });
                        document.querySelectorAll(".pric-option").forEach(option => {
                            option.addEventListener("click", () => {
                                document.querySelectorAll(".pric-option").forEach(other => {
                                    other.classList.remove("pric-option-active");
                                });
                                option.classList.add("pric-option-active");
                                document.querySelector("#pricMaterialSelector div").textContent = option.textContent;

                                document.getElementById("materialUl").querySelectorAll(".pric-li").forEach(li => {
                                    if(li.id.split("-")[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1).toLowerCase()){
                                        li.style.display = "flex";
                                    } else {
                                        li.style.display = "none";
                                    }
                                });
                            });
                        });

                        document.getElementById("materialForm").addEventListener("submit", async (e) => {
                            e.preventDefault();
                            let data = [];
                            document.getElementById("materialForm").querySelectorAll(".new-section").forEach(section => {
                                let newArray = [section.id.split("-")[1], section.querySelector("input").value.replace(/£/g, "").replace("Cost ", ""), section.querySelectorAll("input")[1].value.replace(/£/g, "").replace("Charge ", "")];
                                data.push(newArray);
                            });

                            const res = await fetch(url + "/api/update-materials", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "success") {
                                document.getElementById("materialModal").style.opacity = "0";
                                document.getElementById("materialModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankPrice").style.opacity = "1";
                                    document.getElementById("thankPrice").style.pointerEvents = "auto";
                                    thankPrice.querySelector(".thank-wrapper").style.opacity = "1";
                                    thankPrice.querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 200);
                            }
                        });

                        document.getElementById("editChargesBtn").addEventListener("click", () => {
                            document.getElementById("chargeUl").querySelectorAll(".pric-li").forEach(li => {
                                let newInput = document.createElement("div");
                                newInput.classList.add("new-section");
                                newInput.id = "input-" + li.id.split("-")[1];
                                newInput.innerHTML = `
                                    <div class="new-label">${li.querySelector(".pric-label").textContent} <i class="fa-regular fa-trash-can new-delete-icon"></i></div>
                                    <div class="new-inp-flex">
                                        <input required type="text" placeholder="Charge £" class="new-input" value="${li.querySelector(".pric-txt").textContent}" />
                                    </div>
                                `;
                                document.getElementById("chargeModal").querySelector(".new-col").appendChild(newInput);

                                newInput.querySelector("i.new-delete-icon").addEventListener("click", () => {
                                    newInput.style.display = "none";
                                        li.style.display = "none";

                                    async function deleteCharge() {
                                        const dataToSend = { id: li.id.split("-")[1] };
                                        try {
                                            const response = await fetch(url + '/api/delete-price', {
                                                method: 'POST',
                                                credentials: 'include',
                                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                    'Content-Type': 'application/json', 
                                                },
                                                body: JSON.stringify(dataToSend), 
                                            });

                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                console.error('Error:', errorData.message);
                                                return;
                                            }

                                            const data = await response.json();
                                        } catch (error) {
                                            console.error('Error posting data:', error);
                                        }
                                    }
                                    deleteCharge();
                                });
                            });

                            document.getElementById("chargeModal").querySelectorAll(".new-section")[document.getElementById("chargeModal").querySelectorAll(".new-section").length - 1].querySelector(".new-inp-flex").style.marginBottom = "0px";
                            document.getElementById("chargeModal").style.opacity = "1";
                            document.getElementById("chargeModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("chargeForm").addEventListener("submit", async (e) => {
                            e.preventDefault();
                            let data = [];
                            document.getElementById("chargeForm").querySelectorAll(".new-section").forEach(section => {
                                let newArray = [section.id.split("-")[1], section.querySelector("input").value.replace(/£/g, "")];
                                data.push(newArray);
                            });

                            const res = await fetch(url + "/api/update-charges", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "success") {
                                document.getElementById("chargeModal").style.opacity = "0";
                                document.getElementById("chargeModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankPrice").style.opacity = "1";
                                    document.getElementById("thankPrice").style.pointerEvents = "auto";
                                    thankPrice.querySelector(".thank-wrapper").style.opacity = "1";
                                    thankPrice.querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 200);
                            }
                        });

                        document.getElementById("newChargeBtn").addEventListener("click", () => {
                            document.getElementById("createCharge").style.opacity = "1";
                            document.getElementById("createCharge").style.pointerEvents = "auto";
                        });
                        document.getElementById("createChargeBtn").addEventListener("click", () => {
                            if(document.getElementById("newChargeName").value == "" || document.getElementById("newChargeCost").value == ""){
                                document.getElementById("chargeError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("chargeError").style.display = "none";
                                }, 2000);
                            } else {
                                async function createCharge() {
                                    const dataToSend = { name: document.getElementById("newChargeName").value, charge: document.getElementById("newChargeCost").value.replace("£", "") };
                                    try {
                                        const response = await fetch(url + '/api/create-charge', {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                'Content-Type': 'application/json', 
                                            },
                                            body: JSON.stringify(dataToSend), 
                                        });
    
                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            console.error('Error:', errorData.message);
                                            return;
                                        }
    
                                        const data = await response.json();
                                        if(data.message == "success"){
                                            document.getElementById("createCharge").style.opacity = "0";
                                            document.getElementById("createCharge").style.pointerEvents = "none";
                                            setTimeout(() => {
                                                document.getElementById("thankPrice").style.opacity = "1";
                                                document.getElementById("thankPrice").style.pointerEvents = "auto";
                                                document.getElementById("thankPrice").querySelector(".thank-wrapper").style.opacity = "1";
                                                document.getElementById("thankPrice").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                            }, 300);
                                        }
                                    } catch (error) {
                                        console.error('Error posting data:', error);
                                    }
                                }
                                createCharge();
                            }
                        });

                        document.getElementById("editLabourBtn").addEventListener("click", () => {
                            document.getElementById("labourModal").style.opacity = "1";
                            document.getElementById("labourModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("labourForm").addEventListener("submit", async (e) => {
                            e.preventDefault();
                            let data = [];
                            document.getElementById("labourForm").querySelectorAll("input").forEach(input => {
                                let newArray = [input.id.split("-")[1], input.value.replace(/£/g, ""), input.id.split("-")[0]];
                                data.push(newArray);
                            });

                            const res = await fetch(url + "/api/update-labour", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "success") {
                                document.getElementById("labourModal").style.opacity = "0";
                                document.getElementById("labourModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankPrice").style.opacity = "1";
                                    document.getElementById("thankPrice").style.pointerEvents = "auto";
                                    thankPrice.querySelector(".thank-wrapper").style.opacity = "1";
                                    thankPrice.querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 200);
                            }
                        });
                    
                        /* modal click outs */
                        document.addEventListener("click", (e) => {
                            if(!document.querySelector(".pric-selector").contains(e.target)){
                                document.querySelector("#pricMaterialSelector img").style.transform = "rotate(0deg)";
                                document.querySelector(".pric-drop").style.opacity = "0";
                                document.querySelector(".pric-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.addEventListener("click", (e) => {
                                if(!modal.querySelector(".new-wrapper")?.contains(e.target)){
                                    modal.style.opacity = "0";
                                    modal.style.pointerEvents = "none";
                                }
                            });
                            modal.querySelector("i.new-xmark").addEventListener("click", () => {
                                modal.style.opacity = "0";
                                modal.style.pointerEvents = "none";
                            });
                        });
                    }

                    if(document.querySelector(".reports")){
                        function calcProfits(time){
                            let todayRevenue = 0;
                            let averageRevenue = 0;
                            let todayLabour = 0;
                            let averageLabour = 0;
                            let todayMaterial = 0;
                            let averageMaterial = 0;
                            let todayProfit = 0;
                            let averageProfit = 0;
                            if(time == "daily"){
                                let usedDates = [];
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(job.job_date == todayDate){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else {
                                        if(!usedDates.includes(job.job_date)){
                                            usedDates.push(job.job_date);
                                        }
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});
                                averageRevenue = averageRevenue / usedDates.length || 0;
                                averageLabour = averageLabour / usedDates.length || 0;
                                averageMaterial = averageMaterial / usedDates.length || 0;
                                averageProfit = averageProfit / usedDates.length || 0;

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average day`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue earned today`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue earned today`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average day`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour recorded today`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour today`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average day`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials used today`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials used today`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average day`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit today`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit today`;
                                }
                            } else if(time == "weekly"){
                                let currentDates = [];
                                let pastDates = [];
                                for(let i = 0; i < 14; i++){
                                    if(i > 6){
                                        pastDates.push(getSpecificDate(i));
                                    } else {
                                        currentDates.push(getSpecificDate(i));
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average week`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue this week`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue this week`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average week`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour this week`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour this week`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average week`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials this week`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials this week`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average week`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit this week`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit this week`;
                                }
                            } else if(time == "monthly"){
                                let currentDates = [];
                                let pastDates = [];
                                let gotFirstMonth = false;
                                for(let i = 0; i < 70; i++){
                                    let newDate = getSpecificDate(i);

                                    if(!gotFirstMonth){
                                        currentDates.push(newDate);
                                    } else {
                                        pastDates.push(newDate);
                                    }

                                    if(newDate.slice(0, 2) == "01"){
                                        if(gotFirstMonth) break;

                                        gotFirstMonth = true;
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average month`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue this month`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue this month`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average month`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour this month`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour this month`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average month`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials this month`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials this month`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average month`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit this month`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit this month`;
                                }
                            }
                        }
                        calcProfits("daily");

                        document.querySelectorAll(".rep-toggle-option").forEach((option, idx) => {
                            option.addEventListener("click", () => {
                                let toggleOptions = ["left", "mid", "right"];
                                let calcOptions = ["daily", "weekly", "monthly"];
                                document.querySelector(".rep-toggle span").classList.remove("rep-toggle-left");
                                document.querySelector(".rep-toggle span").classList.remove("rep-toggle-mid");
                                document.querySelector(".rep-toggle span").classList.remove("rep-toggle-right");
                                document.querySelector(".rep-toggle span").classList.add("rep-toggle-" + toggleOptions[idx]);
                                calcProfits(calcOptions[idx]);
                                document.querySelectorAll(".rep-toggle-option").forEach((opt, optIdx) => {
                                    opt.style.color = "hsl(0, 0%, 20%)";
                                    if(optIdx == idx) opt.style.color = "white";
                                });
                            });
                        });

                        let reportJob;
                        let jobFound = false;
                        jobs.forEach((job, idx) => {
                            if(job.job_status == "Completed" && ((!params.get("jobId")) || (params.get("jobId") && job.id == params.get("jobId")))){
                                if(!jobFound) reportJob = job;
                                jobFound = true;
                            } 
                        });
                        function makeJobReport(job){
                            let totalCharges = 2;
                            let chargePrice;
                            if(job.job_charges == "No charges"){
                                totalCharges = 0;
                                chargePrice = "£0";
                            } else {
                                job.job_charges.split("").forEach(letter => {
                                    if(letter == ","){
                                        totalCharges++;
                                    }
                                });
                                if(job.job_charges.includes("£")) totalCharges = 0;
                                totalCharges = totalCharges / 2;
                                chargePrice = "£" + Number(Number(job.job_realcharge.replace("£", "")) - Number(job.labour_charge.replace("£", "")) - Number(job.material_charge.replace("£", "")));
                            }
                            let labourDesc = job.job_progress;
                            if(!labourDesc.includes("hrs")) labourDesc = "call out fee";
                            let jobProfit = Number(job.job_realcharge.replace("£", "")) - Number(job.job_setback.replace("£", ""));
                            let trendImg;
                            let trendTxt;
    
                            let avgProfit = 0;
                            let usedDates = [];
                            jobs.forEach(other => {if(other.job_status == "Completed"){
                                if(other.id != job.id){
                                    if(!usedDates.includes(other.job_date)){
                                        usedDates.push(other.job_date);
                                    }
                                    avgProfit += Number(other.job_realcharge.replace(/£/g, "")) - Number(other.job_setback.replace(/£/g, ""));
                                }
                            }});
                            avgProfit = avgProfit / usedDates.length || 0;
    
                            if(jobProfit >= avgProfit){
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `+${percent}% from average day`;
                                trendImg = "uptrend";
                            } else {
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `${percent}% from average day`;
                                trendImg = "downtrend";
                            }
                            if(jobProfit == 0){
                                trendTxt = `No profit earned`;
                                trendImg = "downtrend";
                            } else if(jobProfit > 0 && avgProfit == 0){
                                trendTxt = `Total profit earned`;
                                trendImg = "uptrend";
                            }
                            document.querySelector(".rep-job-wrapper").innerHTML = `
                                <div class="rep-job-name">${job.job_name}</div>
                                <div class="rep-job-date">Completed ${job.job_date}</div>
                                <div class="rep-circ-container">
                                    <div class="rep-circ circ-fill" id="circLabour"></div>
                                    <div class="rep-circ circ-fill" id="circMaterials"></div>
                                    <div class="rep-circ circ-fill" id="circExtra"></div>
                                    <div class="rep-circ-mid"></div>
                                    <div class="rep-circ-content">
                                        <div class="rep-circ-head">${job.job_setback}</div>
                                        <div class="rep-circ-txt">Total Cost</div>
                                    </div>
                                </div>
                                <div class="rep-job-legend">
                                    <div><span style="background-color: hsl(211, 22%, 34%);"></span> Labour ${job.labour_cost}</div>
                                    <div><span style="background-color: hsl(211, 22%, 54%);"></span> Materials ${job.material_cost}</div>
                                </div>
    
                                <div class="rep-exp">
                                    <div class="rep-exp-top">
                                        <div class="rep-exp-head">End Charge: <span class="rep-exp-head">${job.job_realcharge}</span></div>
                                        <img src="images/icons/chevron.png" class="rep-exp-chev" />
                                    </div>
    
                                    <div class="rep-exp-drop">
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Labour Charge</div>
                                                <div class="rep-exp-txt">${labourDesc}</div>
                                            </div>
                                            <div class="rep-exp-num">${job.labour_charge}</div>
                                        </div>
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Materials Charge</div>
                                                <div class="rep-exp-txt">${job.material_cost} worth used</div>
                                            </div>
                                            <div class="rep-exp-num">${job.material_charge}</div>
                                        </div>
                                        <div class="rep-exp-section" style="padding-bottom: 5px;">
                                            <div>
                                                <div class="rep-exp-name">Extra Charges</div>
                                                <div class="rep-exp-txt">${totalCharges} charges applied</div>
                                            </div>
                                            <div class="rep-exp-num">${chargePrice}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="rep-prof">
                                    <div class="rep-prof-head"><span style="background-color: var(--primary);"></span> Job Profit</div>
                                    <div class="rep-prof-num">£${jobProfit} <img src="images/icons/${trendImg}.png" /></div>
                                    <div class="rep-prof-txt">${trendTxt}</div>
                                </div>
                            `;
                            let labourPercent = 360 * (Number(job.labour_cost.replace("£", "")) / Number(job.job_setback.replace("£", "")));
                            document.getElementById("circLabour").style.background = `
                                conic-gradient(
                                    from 0deg,
                                    hsl(211, 22%, 34%) 0deg ${labourPercent}deg,
                                    transparent ${labourPercent + 0.5}deg  360deg 
                                )
                            `;
                            document.querySelector(".rep-exp").addEventListener("click", () => {
                                if(document.querySelector(".rep-exp-chev").style.transform == "rotate(90deg)"){
                                    document.querySelector(".rep-exp-drop").style.opacity = "0";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "0px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "0px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(0deg)";
                                } else {
                                    document.querySelector(".rep-exp-drop").style.opacity = "1";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "25px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "200px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(90deg)";
                                }
                            });
                        }
                        if(!reportJob){
                            document.getElementById("repJobEmpty").style.display = "block";
                            document.querySelector(".rep-job-wrapper").style.display = "none";
                        } else {
                            makeJobReport(reportJob);
                        }
                        document.getElementById("repJobSearch").addEventListener("input", () => {
                            document.getElementById("repJobSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repJobSearch input").value;
                            if(newValue.length > 0 && jobs){
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(job.job_name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = job.job_name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repJobSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            makeJobReport(job);
                                            document.querySelector("#repJobSearch input").value = job.job_name;
                                            document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                }});
                                if(document.getElementById("repJobSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repJobSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });

                        let reportWorker;
                        let workerFound = false;
                        workers.forEach((worker, idx) => {
                            let workerValid = false;
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && job.job_status == "Completed"){
                                    workerValid = true;
                                }
                            });
                            if((!params.get("workerId")) || (params.get("workerId") && worker.id == params.get("workerId"))){
                                if(workerValid){
                                    if(!workerFound) reportWorker = worker;
                                    workerFound = true;
                                }
                            } 
                        });
                        document.querySelector(".dash-perf-btn").addEventListener("click", () => {
                            currentFrom = document.getElementById("dashPerfFrom").value;
                            currentTo = document.getElementById("dashPerfTo").value;
                            if(currentFrom.length == 10 && currentFrom.includes("/") && currentTo != ""){
                                makeWorkerReport(currentWorker);
                            }
                        });
                        let currentWorker;
                        let currentFrom;
                        let currentTo;
                        function makeWorkerReport(worker){
                            currentWorker = worker;
                            let workerJobs = [];
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && job.job_status == "Completed" && (!currentFrom || isDateBetween(job.job_date, currentFrom, currentTo))) workerJobs.push(job);
                            });

                            let hoursWorked = 0;
                            let minsWorked = 0;
                            let totalJobs = workerJobs.length;
                            let avgSpeed = 0;
                            let avgProfit = 0;
                            let totalProfit = 0;
                            workerJobs.forEach(job => {if(job.job_status == "Completed"){
                                if(job.job_progress.includes("hrs")){
                                    hoursWorked += Number(job.job_progress.slice(0, job.job_progress.indexOf("h") - 1));
                                    minsWorked += Number(job.job_progress.slice(job.job_progress.lastIndexOf("hrs") + 2, job.job_progress.indexOf("m") - 1));
                                    avgSpeed += (Number(job.job_progress.slice(0, job.job_progress.indexOf("h") - 1)) * 60) + Number(job.job_progress.slice(job.job_progress.lastIndexOf("hrs") + 2, job.job_progress.indexOf("m") - 1));
                                } else {
                                    minsWorked += Number(job.job_progress.slice(0, job.job_progress.indexOf("m") - 1));
                                    avgSpeed += Number(job.job_progress.slice(0, job.job_progress.indexOf("m") - 1));
                                }
                                totalProfit += Number(job.job_realcharge.replace("£", "")) - Number(job.job_setback.replace("£", ""));
                            }});
                            hoursWorked += Math.floor(minsWorked / 60);
                            avgProfit = Number(totalProfit / totalJobs) || 0;
                            avgSpeed = avgSpeed / totalJobs;
                            let avgHours = Math.round(avgSpeed / 60) || 0;
                            let avgMins = Math.round(avgSpeed % 60) || 0;
                            avgSpeed = avgHours + "h " + avgMins + "m";

                            document.querySelectorAll(".rep-worker-num")[0].textContent = hoursWorked;
                            document.querySelectorAll(".rep-worker-num")[1].textContent = totalJobs;
                            document.querySelectorAll(".rep-worker-num")[2].textContent = "£" + totalProfit.toFixed(2);
                            document.querySelectorAll(".rep-worker-num")[3].textContent = "£" + Number(avgProfit).toFixed(2);
                        }
                        if(!reportWorker){
                            document.getElementById("repWorkerEmpty").style.display = "block";
                            document.getElementById("workerReportContent").style.display = "none";
                        } else {
                            makeWorkerReport(reportWorker);
                        }                        

                        document.getElementById("repWorkerSearch").addEventListener("input", () => {
                            document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repWorkerSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repWorkerSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            makeWorkerReport(worker);
                                            document.querySelector("#repWorkerSearch input").value = worker.name;
                                            document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repWorkerSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });

                        /* MODAL CLICK OUTS */
                        document.addEventListener("click", (e) => {
                            if(!document.getElementById("repJobSearch").contains(e.target)){
                                document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                            if(!document.getElementById("repWorkerSearch").contains(e.target)){
                                document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("#repJobSearch input").addEventListener("focus", () => {
                            document.getElementById("repJobSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repJobSearch input").value;
                            if(newValue.length > 0 && jobs){
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(job.job_name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = job.job_name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repJobSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            makeJobReport(job);
                                            document.querySelector("#repJobSearch input").value = job.job_name;
                                            document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                }});
                                if(document.getElementById("repJobSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repJobSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repJobSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repJobSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("#repWorkerSearch input").addEventListener("focus", () => {
                            document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repWorkerSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repWorkerSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            makeWorkerReport(worker);
                                            document.querySelector("#repWorkerSearch input").value = worker.name;
                                            document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repWorkerSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                    } 

                    if(document.querySelector(".account")){
                        document.querySelector(".acc-name").textContent = userData.name;
                        document.querySelector(".acc-email").textContent = userData.email;

                        if(params.get("admin")){
                            document.querySelector(".acc-back").style.display = "none";
                            document.querySelector(".acc-title").style.marginTop = "30px";
                        } else {
                            document.querySelector(".acc-back").addEventListener("click", () => {
                                changePage(0);
                            }); 
                        }

                        document.getElementById("editProfileBtn").addEventListener("click", () => {
                            document.querySelector(".home-name").value = userData.name;
                            document.getElementById("profileName").value = userData.name;
                            document.getElementById("profileEmail").value = userData.email;
                            document.getElementById("profilePhone").value = userData.phone;
                            document.getElementById("profileModal").style.opacity = "1";
                            document.getElementById("profileModal").style.pointerEvents = "auto";
                            document.getElementById("profileModal").style.left = "0px";
                        });
                        document.getElementById("profileBack").addEventListener("click", () => {
                            document.getElementById("profileModal").style.opacity = "0";
                            document.getElementById("profileModal").style.pointerEvents = "none";
                            document.getElementById("profileModal").style.left = "255px";
                        });
                        document.getElementById("saveProfileBtn").addEventListener("click", () => {
                            async function saveProfile() {
                                const dataToSend = { name: document.getElementById("profileName").value, email: document.getElementById("profileEmail").value, phone: document.getElementById("profilePhone").value };
                                try {
                                    const response = await fetch(url + '/api/save-profile', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            'Content-Type': 'application/json', 
                                        },
                                        body: JSON.stringify(dataToSend), 
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Error:', errorData.message);
                                        return;
                                    }

                                    const data = await response.json();
                                    if(data.message == "success"){
                                        userData = data.userData;
                                        document.querySelector(".home-name").textContent = userData.name;
                                        document.querySelector(".acc-name").textContent = userData.name;
                                        document.querySelector(".acc-email").textContent = userData.email;
                                        document.getElementById("profileModal").style.opacity = "0";
                                        document.getElementById("profileModal").style.pointerEvents = "none";
                                        document.getElementById("profileModal").style.left = "255px";
                                    }
                                } catch (error) {
                                    console.error('Error posting data:', error);
                                }
                            }
                            saveProfile();
                        });

                        document.getElementById("newPasswordBtn").addEventListener("click", () => {
                            document.getElementById("changePasswordModal").style.opacity = "1";
                            document.getElementById("changePasswordModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("changePasswordBtn").addEventListener("click", () => {
                            async function changePassword() {
                                const dataToSend = { currentPassword: document.getElementById("currentPassword").value, newPassword: document.getElementById("newPassword").value };
                                try {
                                    const response = await fetch(url + '/api/change-password', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            'Content-Type': 'application/json', 
                                        },
                                        body: JSON.stringify(dataToSend), 
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Error:', errorData.message);
                                        return;
                                    }

                                    const data = await response.json();
                                    if(data.message == "success"){
                                        document.getElementById("changePasswordModal").style.opacity = "0";
                                        document.getElementById("changePasswordModal").style.pointerEvents = "none";
                                        setTimeout(() => {
                                            document.getElementById("thankPassword").style.opacity = "1";
                                            document.getElementById("thankPassword").style.pointerEvents = "auto";
                                            document.getElementById("thankPassword").querySelector(".thank-wrapper").style.opacity = "1";
                                            document.getElementById("thankPassword").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                            document.getElementById("changePasswordModal").querySelectorAll("input").forEach(input => {
                                                input.value = "";
                                            });
                                        }, 300);
                                    } else if(data.message == "failure"){
                                        document.getElementById("randomError").style.display = "block";
                                        setTimeout(() => {
                                            document.getElementById("randomError").style.display = "none";
                                        }, 2000);
                                    } else if(data.message == "invalid password"){
                                        document.getElementById("invalidError").style.display = "block";
                                        setTimeout(() => {
                                            document.getElementById("invalidError").style.display = "none";
                                        }, 2000);
                                    }
                                } catch (error) {
                                    console.error('Error posting data:', error);
                                }
                            }
                            if(document.getElementById("newPassword").value == document.getElementById("confirmPassword").value){
                                changePassword();
                            } else {
                                document.getElementById("diffError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("diffError").style.display = "none";
                                }, 2000);
                            }
                        });

                        document.getElementById("newContactBtn").addEventListener("click", () => {
                            document.getElementById("contactModal").style.opacity = "1";
                            document.getElementById("contactModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("contactForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            const res = await fetch(url + "/api/contact", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "success"){
                                document.getElementById("contactModal").style.opacity = "0";
                                document.getElementById("contactModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankContact").style.opacity = "1";
                                    document.getElementById("thankContact").style.pointerEvents = "auto";
                                    document.getElementById("thankContact").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankContact").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });

                        document.getElementById("newPushBtn").addEventListener("click", () => {
                            document.getElementById("pushModal").style.opacity = "1";
                            document.getElementById("pushModal").style.pointerEvents = "auto";
                            document.getElementById("pushModal").style.left = "0px";
                        });
                        document.getElementById("pushBack").addEventListener("click", () => {
                            document.getElementById("pushModal").style.opacity = "0";
                            document.getElementById("pushModal").style.pointerEvents = "none";
                            document.getElementById("pushModal").style.left = "255px";
                        });
                        document.querySelectorAll(".push-toggle").forEach(toggle => {
                            toggle.addEventListener("click", () => {
                                if(toggle.classList.contains("push-toggle-active")){
                                    toggle.querySelector("span").classList.remove("push-toggle-right");
                                    toggle.querySelector("span").classList.add("push-toggle-left");
                                    toggle.classList.remove("push-toggle-active");
                                } else {
                                    toggle.querySelector("span").classList.add("push-toggle-right");
                                    toggle.querySelector("span").classList.remove("push-toggle-left");
                                    toggle.classList.add("push-toggle-active");
                                }
                            });
                        });

                        document.getElementById("newLogout").addEventListener("click", () => {
                            document.getElementById("logoutModal").style.opacity = "1";
                            document.getElementById("logoutModal").style.pointerEvents = "auto";
                        });
                        document.getElementById("logoutModal").addEventListener("click", (e) => {
                            if(!document.getElementById("logoutModal").querySelector(".book-delete-wrapper").contains(e.target)){
                                document.getElementById("logoutModal").style.opacity = "0";
                                document.getElementById("logoutModal").style.pointerEvents = "none";
                            }
                        });
                        document.getElementById("logoutModal").querySelector(".btn-book-nodelete").addEventListener("click", () => {
                            document.getElementById("logoutModal").style.opacity = "0";
                            document.getElementById("logoutModal").style.pointerEvents = "none";
                        });
                        document.getElementById("logoutModal").querySelector(".btn-book-delete-booking").addEventListener("click", () => {
                            async function logout() {
                                try {
                                    const response = await fetch(`${url}/api/logout`, {
                                        method: 'GET',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                                        credentials: 'include'
                                    });
                                    const data = await response.json(); 
                                    if(data.message == "success"){
                                        localStorage.clear();
                                        window.location.href = gitName + "/login.html";
                                    }
                                } catch (error) {
                                    console.error('Error fetching data:', error);
                                }
                            }
                            logout();
                        });

                        /* modal click outs */
                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.addEventListener("click", (e) => {
                                if(!modal.querySelector(".new-wrapper").contains(e.target)){
                                    modal.style.opacity = "0";
                                    modal.style.pointerEvents = "none";
                                }
                            });
                            modal.querySelector("i.new-xmark").addEventListener("click", () => {
                                modal.style.opacity = "0";
                                modal.style.pointerEvents = "none";
                            });
                        });
                    }

                    if(document.querySelector(".dashboard")){
                        if(localStorage.getItem("logo")){
                            document.querySelector(".header-logo").src = localStorage.getItem("logo");
                        }

                        let deleteWorkerId;
                        function setCalendar(){
                            let daysAhead = calendarIdx * 6;
                            let firstDate = getSpecificDate(daysAhead * -1);
                            let monthTxt = `${months[Number(firstDate.split("/")[1]) - 1]} ${firstDate.split("/")[2]}`;
                            document.querySelector(".lac-nav-title").textContent = monthTxt;
                            for(let i = 0; i < 6; i++){
                                let newDate = getSpecificDate((daysAhead + i) * -1).split("/")[0];
                                let dayTxt = getDay(getSpecificDate((daysAhead + i) * -1));
                                document.querySelectorAll(".lac-top-real")[i].innerHTML = `${dayTxt}<span class="lac-top-mon">${newDate}</span>`;
                            }

                            document.querySelectorAll(".lac-flex").forEach(worker => {
                                worker.querySelectorAll(".lac-box-real").forEach((box, idx) => {
                                    box.innerHTML = "";
                                    let boxDate = getSpecificDate((daysAhead + idx) * -1);
                                    jobs.forEach(job => {
                                        if(boxDate.includes("05/01/2026") && job.id == 1){
                                            console.log(job.user_id + " vs " + worker.id.split("-")[1] + " <br> " + job.job_date + " vs " + boxDate);
                                        }
                                        if(job.user_id == worker.id.split("-")[1] && job.job_date == boxDate){
                                            let newJob = document.createElement("div");
                                            newJob.classList.add("lac-job");
                                            newJob.innerHTML = `
                                                <div class="lac-job-name">${job.job_name}</div>
                                                <div class="lac-job-time">${job.job_time} - ${job.job_finish}</div>
                                            `;
                                            box.appendChild(newJob);
                                        }
                                    });

                                    box.addEventListener("click", () => {
                                        document.getElementById("newJobModal").style.opacity = "1";
                                        document.getElementById("newJobModal").style.pointerEvents = "auto";
                                        document.getElementById("jobDateLabel").style.display = "none";
                                        document.getElementById("jobDateSelector").style.display = "none";
                                        document.getElementById("jobDateInput").value = boxDate;
                                        document.getElementById("workerInput").value = worker.id.split("-")[0];
                                        document.getElementById("idInput").value = worker.id.split("-")[1];
                                    });
                                });
                            });
                        }
                        document.querySelectorAll(".lac-nav-chevron").forEach((chev, idx) => {
                            chev.addEventListener("click", () => {
                                if(idx == 0 && calendarIdx > 0){
                                    calendarIdx--;
                                } else if(idx == 1){
                                    calendarIdx++;
                                }
                                setCalendar();
                            });
                        });
                        workers.forEach((worker, idx) => {
                            let newFlex = document.createElement("div");
                            newFlex.classList.add("lac-flex");
                            newFlex.id = worker.name + "-" + worker.id;
                            newFlex.innerHTML = `
                                <div class="lac-box lac-worker-box" style="border-left: 0;">
                                    <div class="lac-worker">${worker.name}</div>
                                </div>
                                <div class="lac-box lac-box-real"></div>
                                <div class="lac-box lac-box-real"></div>
                                <div class="lac-box lac-box-real"></div>
                                <div class="lac-box lac-box-real"></div>
                                <div class="lac-box lac-box-real"></div>
                                <div class="lac-box lac-box-real" style="border-right: 0;"></div>
                            `;
                            document.querySelector(".lac-right-col").appendChild(newFlex);

                            if(idx == workers.length - 1){
                                newFlex.querySelectorAll(".lac-box").forEach(box => box.style.borderBottom = "0px solid hsl(0, 0%, 88%)");
                            }
                        });
                        document.querySelector(".lac-top-mon i").addEventListener("click", () => {
                            document.getElementById("newWorkerModal").style.opacity = "1";
                            document.getElementById("newWorkerModal").style.pointerEvents = "auto";
                        });
                        setCalendar();

                        function calcProfits(time){
                            let todayRevenue = 0;
                            let averageRevenue = 0;
                            let todayLabour = 0;
                            let averageLabour = 0;
                            let todayMaterial = 0;
                            let averageMaterial = 0;
                            let todayProfit = 0;
                            let averageProfit = 0;
                            
                            if(time == "daily"){
                                let usedDates = [];
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(job.job_date == todayDate){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else {
                                        if(!usedDates.includes(job.job_date)){
                                            usedDates.push(job.job_date);
                                        }
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});
                                averageRevenue = averageRevenue / usedDates.length || 0;
                                averageLabour = averageLabour / usedDates.length || 0;
                                averageMaterial = averageMaterial / usedDates.length || 0;
                                averageProfit = averageProfit / usedDates.length || 0;

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average day`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue earned today`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue earned today`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average day`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour recorded today`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour today`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average day`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials used today`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials used today`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average day`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average day`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit today`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit today`;
                                }
                            } else if(time == "weekly"){
                                let currentDates = [];
                                let pastDates = [];
                                for(let i = 0; i < 14; i++){
                                    if(i > 6){
                                        pastDates.push(getSpecificDate(i));
                                    } else {
                                        currentDates.push(getSpecificDate(i));
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average week`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue this week`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue this week`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average week`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour this week`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour this week`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average week`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials this week`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials this week`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average week`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average week`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit this week`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit this week`;
                                }
                            } else if(time == "monthly"){
                                let currentDates = [];
                                let pastDates = [];
                                let gotFirstMonth = false;
                                for(let i = 0; i < 70; i++){
                                    let newDate = getSpecificDate(i);

                                    if(!gotFirstMonth){
                                        currentDates.push(newDate);
                                    } else {
                                        pastDates.push(newDate);
                                    }

                                    if(newDate.slice(0, 2) == "01"){
                                        if(gotFirstMonth) break;

                                        gotFirstMonth = true;
                                    }
                                }
                                jobs.forEach(job => {if(job.job_status == "Completed"){
                                    if(currentDates.includes(job.job_date)){
                                        todayRevenue += Number(Number(job.job_realcharge.replace(/£/g, "")).toFixed(2));
                                        todayLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        todayMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        todayProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    } else if(pastDates.includes(job.job_date)){
                                        averageRevenue += Number(job.job_realcharge.replace(/£/g, ""));
                                        averageLabour += Number(job.labour_cost.replace(/£/g, ""));
                                        averageMaterial += Number(job.material_cost.replace(/£/g, ""));
                                        averageProfit += Number(job.job_realcharge.replace(/£/g, "")) - Number(job.job_setback.replace(/£/g, ""));
                                    }
                                }});

                                if(todayRevenue >= averageRevenue){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayRevenue / averageRevenue) - 1) * 100).toFixed(0);
                                    document.getElementById("totalRevenueText").textContent = `${percent}% from average month`;
                                }
                                if(todayRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `No revenue this month`;
                                } else if(todayRevenue > 0 && averageRevenue == 0){
                                    document.getElementById("totalRevenueNum").innerHTML = `£${todayRevenue.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalRevenueText").textContent = `Total revenue this month`;
                                }

                                if(todayLabour >= averageLabour){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayLabour / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalLabourText").textContent = `${percent}% from average month`;
                                }
                                if(todayLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `No labour this month`;
                                } else if(todayLabour > 0 && averageLabour == 0){
                                    document.getElementById("totalLabourNum").innerHTML = `£${todayLabour.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalLabourText").textContent = `Total labour this month`;
                                }

                                if(todayMaterial >= averageLabour){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayMaterial / averageLabour) - 1) * 100).toFixed(0);
                                    document.getElementById("totalMaterialText").textContent = `${percent}% from average month`;
                                }
                                if(todayMaterial == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `No materials this month`;
                                } else if(todayMaterial > 0 && averageLabour == 0){
                                    document.getElementById("totalMaterialNum").innerHTML = `£${todayMaterial.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalMaterialText").textContent = `Total materials this month`;
                                }

                                if(todayProfit >= averageProfit){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `+${percent}% from average month`;
                                } else {
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    let percent = (((todayProfit / averageProfit) - 1) * 100).toFixed(0);
                                    document.getElementById("totalProfitText").textContent = `${percent}% from average month`;
                                }
                                if(todayProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/downtrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `No profit this month`;
                                } else if(todayProfit > 0 && averageProfit == 0){
                                    document.getElementById("totalProfitNum").innerHTML = `£${todayProfit.toFixed(2)} <img src="images/icons/uptrend.png" />`;
                                    document.getElementById("totalProfitText").textContent = `Total profit this month`;
                                }
                            }
                        }
                        calcProfits("daily");

                        function showNoJobs(){
                            document.querySelector(".dash-table-scroll").style.display = "none";
                            document.getElementById("dashEmpty").style.display = "block";
                        }
                        let validJobs = 0;
                        jobs.forEach(job => {
                            let newRow = document.createElement("div");
                            newRow.classList.add("admin-table-row");
                            newRow.id = job.id;

                            let statusClass = "pending";
                            let reportIcon = "";
                            validJobs++;
                            if(job.job_status == "In Progress"){
                                statusClass = "active";
                            } else if(job.job_status == "Completed"){
                                let allowedDates = [];
                                for(let i = 0; i < 7; i++){
                                    allowedDates.push(getSpecificDate(i));
                                }
                                if(!allowedDates.includes(job.job_date)){
                                    validJobs--;
                                    newRow.style.display = "none";
                                }
                                reportIcon = '<i class="fa-solid fa-chart-line admin-report-icon"></i>';
                                statusClass = "completed";
                            }
                            let materialHtml = '<div class="admin-material-btn">View Materials</div>';
                            if(job.job_materials == "No materials used") materialHtml = "No materials yet";
                            let notesSpan = "";
                            if(job.job_notes == "No notes yet." || job.job_notes.length < 23) notesSpan = "style='display: none;'"
                            newRow.innerHTML = `
                                <div class="admin-table-txt">${job.job_date.slice(0, 5)} - ${job.job_time}</div>
                                <div class="admin-table-txt fow500">${job.job_customer}</div>
                                <div class="admin-table-txt">${job.job_address}</div>
                                <div class="admin-table-txt">${job.job_worker}</div>
                                <div class="admin-table-txt">
                                    <div class="admin-table-status admin-status-${statusClass}">${job.job_status}</div>
                                </div>
                                <div class="admin-table-icon">
                                    <i class="fa-regular fa-pen-to-square admin-edit-icon"></i>
                                    <i class="fa-regular fa-trash-can admin-delete-icon"></i>
                                    ${reportIcon}
                                </div>
                                <div class="admin-table-txt">${job.job_progress}</div>
                                <div class="admin-table-txt admin-material-element">
                                    ${materialHtml}
                                </div>
                                <div class="admin-table-txt">
                                    <div class="admin-table-notes">${job.job_notes.slice(0, 23)}...<br><span ${notesSpan}>Read more</span></div>
                                </div>
                            `;
                            document.querySelector(".dash-table-col").appendChild(newRow);
                        });
                        if(validJobs == 0){
                            showNoJobs();
                        }

                        function dashMakeJobReport(job){
                            let totalCharges = 2;
                            job.job_charges.split("").forEach(letter => {
                                if(letter == ","){
                                    totalCharges++;
                                }
                            });
                            if(job.job_charges.includes("£")) totalCharges = 0;
                            totalCharges = totalCharges / 2;
                            let chargePrice = "£" + Number(Number(job.job_realcharge.replace("£", "")) - Number(job.labour_charge.replace("£", "")) - Number(job.material_charge.replace("£", "")));
                            let labourDesc = job.job_progress;
                            if(!labourDesc.includes("hrs")) labourDesc = "call out fee";
                            let jobProfit = Number(job.job_realcharge.replace("£", "")) - Number(job.job_setback.replace("£", ""));
                            let trendImg;
                            let trendTxt;
    
                            let avgProfit = 0;
                            let usedDates = [];
                            jobs.forEach(other => {if(other.job_status == "Completed"){
                                if(other.id != job.id){
                                    if(!usedDates.includes(other.job_date)){
                                        usedDates.push(other.job_date);
                                    }
                                    avgProfit += Number(other.job_realcharge.replace(/£/g, "")) - Number(other.job_setback.replace(/£/g, ""));
                                }
                            }});
                            avgProfit = avgProfit / usedDates.length || 0;
    
                            if(jobProfit >= avgProfit){
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `+${percent}% from average day`;
                                trendImg = "uptrend";
                            } else {
                                let percent = (((jobProfit / avgProfit) - 1) * 100).toFixed(0);
                                trendTxt = `${percent}% from average day`;
                                trendImg = "downtrend";
                            }
                            if(jobProfit == 0){
                                trendTxt = `No profit earned`;
                                trendImg = "downtrend";
                            } else if(jobProfit > 0 && avgProfit == 0){
                                trendTxt = `Total profit earned`;
                                trendImg = "uptrend";
                            }
                            document.querySelector(".rep-job-wrapper").innerHTML = `
                                <i class="fa-solid fa-xmark new-xmark"></i>
                                <div class="rep-job-name">${job.job_name}</div>
                                <div class="rep-job-date">Completed ${job.job_date}</div>
                                <div class="rep-circ-container">
                                    <div class="rep-circ circ-fill" id="circLabour"></div>
                                    <div class="rep-circ circ-fill" id="circMaterials"></div>
                                    <div class="rep-circ circ-fill" id="circExtra"></div>
                                    <div class="rep-circ-mid"></div>
                                    <div class="rep-circ-content">
                                        <div class="rep-circ-head">${job.job_setback}</div>
                                        <div class="rep-circ-txt">Total Cost</div>
                                    </div>
                                </div>
                                <div class="rep-job-legend">
                                    <div><span style="background-color: hsl(211, 22%, 34%);"></span> Labour ${job.labour_cost}</div>
                                    <div><span style="background-color: hsl(211, 22%, 54%);"></span> Materials ${job.material_cost}</div>
                                </div>
    
                                <div class="rep-exp">
                                    <div class="rep-exp-top">
                                        <div class="rep-exp-head">End Charge: <span class="rep-exp-head">${job.job_realcharge}</span></div>
                                        <img src="images/icons/chevron.png" class="rep-exp-chev" />
                                    </div>
    
                                    <div class="rep-exp-drop">
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Labour Charge</div>
                                                <div class="rep-exp-txt">${labourDesc}</div>
                                            </div>
                                            <div class="rep-exp-num">${job.labour_charge}</div>
                                        </div>
                                        <div class="rep-exp-section">
                                            <div>
                                                <div class="rep-exp-name">Materials Charge</div>
                                                <div class="rep-exp-txt">${job.material_cost} worth used</div>
                                            </div>
                                            <div class="rep-exp-num">${job.material_charge}</div>
                                        </div>
                                        <div class="rep-exp-section" style="padding-bottom: 5px;">
                                            <div>
                                                <div class="rep-exp-name">Extra Charges</div>
                                                <div class="rep-exp-txt">${totalCharges} charges applied</div>
                                            </div>
                                            <div class="rep-exp-num">${chargePrice}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="rep-prof">
                                    <div class="rep-prof-head"><span style="background-color: var(--primary);"></span> Job Profit</div>
                                    <div class="rep-prof-num">£${jobProfit} <img src="images/icons/${trendImg}.png" /></div>
                                    <div class="rep-prof-txt">${trendTxt}</div>
                                </div>
                            `;
                            document.querySelector(".rep-job-wrapper").querySelector("i.new-xmark").addEventListener("click", () => {
                                document.getElementById("jobReportModal").style.opacity = "0";
                                document.getElementById("jobReportModal").style.pointerEvents = "none";
                            });
                            let labourPercent = 360 * (Number(job.labour_cost.replace("£", "")) / Number(job.job_setback.replace("£", "")));
                            document.getElementById("circLabour").style.background = `
                                conic-gradient(
                                    from 0deg,
                                    hsl(211, 22%, 34%) 0deg ${labourPercent}deg,
                                    transparent ${labourPercent + 0.5}deg  360deg 
                                )
                            `;
                            document.querySelector(".rep-exp").addEventListener("click", () => {
                                if(document.querySelector(".rep-exp-chev").style.transform == "rotate(90deg)"){
                                    document.querySelector(".rep-exp-drop").style.opacity = "0";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "0px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "0px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(0deg)";
                                } else {
                                    document.querySelector(".rep-exp-drop").style.opacity = "1";
                                    document.querySelector(".rep-exp-drop").style.marginTop = "25px";
                                    document.querySelector(".rep-exp-drop").style.maxHeight = "200px";
                                    document.querySelector(".rep-exp-chev").style.transform = "rotate(90deg)";
                                }
                            });
                        }


                        document.querySelectorAll(".edit-mat-selector").forEach((sel, idx) => {
                            sel.addEventListener("click", (e) => {
                                if(!sel.querySelector(".edit-mat-drop").contains(e.target)){
                                    if(sel.querySelector(".edit-mat-chev").style.transform == "rotate(-90deg)"){
                                        sel.style.marginBottom = "0px";
                                        sel.querySelector(".edit-mat-drop").style.opacity = "0";
                                        sel.querySelector(".edit-mat-drop").style.pointerEvents = "none";
                                        sel.querySelector(".edit-mat-chev").style.transform = "rotate(90deg)";
                                    } else {
                                        let marginBottom = sel.querySelector(".edit-mat-drop").offsetHeight + 27 + "px";
                                        sel.style.marginBottom = marginBottom;
                                        sel.querySelector(".edit-mat-drop").style.opacity = "1";
                                        sel.querySelector(".edit-mat-drop").style.pointerEvents = "auto";
                                        sel.querySelector(".edit-mat-chev").style.transform = "rotate(-90deg)";
                                    }
                                }
                            });
                        });
    
                        let materials = []; // [name, value, unit]
                        let charges = [];
                        async function getMaterials() {
                            let data = {};
                            try {
                                const response = await fetch(`${url}/api/get-materials`, {
                                    method: 'GET',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                                    credentials: 'include'
                                });
                                data = await response.json();

                                localStorage.setItem("materials", JSON.stringify(data.materials));
                            } catch (error) {
                                console.error('Error fetching data:', error);
                                if(localStorage.getItem("materials") && localStorage.getItem("materials").includes("[")){
                                    data.materials = JSON.parse(localStorage.getItem("materials"));
                                } else {
                                    data.materials = [];
                                }
                            }
                            document.querySelectorAll(".edit-mat-wrapper").forEach(wrapper => {
                                if(wrapper.id == "chargeWrapper"){
                                    data.materials.forEach(mat => {
                                        if(mat.area == "charges"){
                                            let newOption = document.createElement("div");
                                            newOption.classList.add("edit-mat-option");
                                            newOption.id = "charge-" + mat.id;
                                            newOption.innerHTML = mat.name + ' <i class="fa-solid fa-check"></i>';
                                            wrapper.querySelector(".edit-mat-drop").appendChild(newOption);
                                        }
                                    });
                                    wrapper.querySelectorAll(".edit-mat-option").forEach(option => {
                                        option.addEventListener("click", () => {
                                            if(!option.classList.contains("edit-mat-active")){
                                                charges.push(option.id.split("-")[1]);
                                                option.classList.add("edit-mat-active");
                                                let newMaterial = document.createElement("div");
                                                newMaterial.classList.add("edit-mat-section");
                                                newMaterial.innerHTML = `
                                                    <div class="edit-mat-name">${option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)}</div>
                                                    <i class="fa-solid fa-trash-can edit-charge-delete" style="display: block;"></i>
                                                `;
                                                wrapper.querySelector(".edit-mat-col").appendChild(newMaterial);
                                                setTimeout(() => {
                                                    wrapper.querySelector(".edit-mat-col").style.marginTop = "25px";
                                                    newMaterial.style.maxHeight = "40px";
                                                    newMaterial.style.opacity = "1";
                                                }, 30);
            
                                                newMaterial.querySelector("i.edit-charge-delete").addEventListener("click", () => {
                                                    option.classList.remove("edit-mat-active");
                                                    newMaterial.style.maxHeight = "0px";
                                                    newMaterial.style.opacity = "0";
                                                    setTimeout(() => {
                                                        wrapper.querySelector(".edit-mat-col").removeChild(newMaterial);
                                                    }, 300);
                                                    charges.splice(charges.indexOf(option.id.split("-")[1]), 1);
                                                    if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                        wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                                    }
                                                });    
                                            } else {
                                                charges.splice(charges.indexOf(option.id.split("-")[1]), 1);
                                                option.classList.remove("edit-mat-active");
                                                document.querySelectorAll(".edit-mat-section").forEach(section => {
                                                    if(section.querySelector(".edit-mat-name").innerHTML == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                        section.style.maxHeight = "0px";
                                                        section.style.opacity = "0";
                                                        setTimeout(() => {
                                                            wrapper.querySelector(".edit-mat-col").removeChild(section);
                                                        }, 300);
                                                    }
                                                });
                                                if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                    wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    data.materials.forEach(mat => {
                                        if(wrapper.querySelector(".edit-mat-label").textContent.toLowerCase() == mat.type.toLowerCase() && mat.area == "materials"){
                                            let newOption = document.createElement("div");
                                            newOption.classList.add("edit-mat-option");
                                            newOption.id = mat.default_value + "-" + mat.unit + "-" + mat.default_value + "-" + mat.step; // value, unit, default, step
                                            newOption.innerHTML = mat.name + ' <i class="fa-solid fa-check"></i>';
                                            wrapper.querySelector(".edit-mat-drop").appendChild(newOption);
                                        }
                                    });
                                    wrapper.querySelectorAll(".edit-mat-option").forEach(option => {
                                        option.addEventListener("click", () => {
                                            if(!option.classList.contains("edit-mat-active")){
                                                option.classList.add("edit-mat-active");
                                                let newMaterial = document.createElement("div");
                                                newMaterial.classList.add("edit-mat-section");
                                                newMaterial.innerHTML = `
                                                    <div class="edit-mat-name">${option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)}</div>
                                                    <div class="edit-mat-quan">
                                                        <i class="fa-solid fa-minus edit-mat-minus"></i>
                                                        <i class="fa-solid fa-trash-can edit-mat-delete"></i>
                                                        <span>${option.id.split("-")[0]} <span>${option.id.split("-")[1]}</span></span>
                                                        <i class="fa-solid fa-plus edit-mat-plus"></i>
                                                    </div>
                                                `;
                                                if((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) <= 0){
                                                    newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                                    newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                                }
                                                wrapper.querySelector(".edit-mat-col").appendChild(newMaterial);
                                                setTimeout(() => {
                                                    wrapper.querySelector(".edit-mat-col").style.marginTop = "25px";
                                                    newMaterial.style.maxHeight = "40px";
                                                    newMaterial.style.opacity = "1";
                                                }, 30);
            
                                                newMaterial.querySelector("i.edit-mat-plus").addEventListener("click", () => {
                                                    newMaterial.querySelector(".edit-mat-quan span").innerHTML = String(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) + Number(option.id.split("-")[3])) + newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)
                                                    newMaterial.querySelector("i.edit-mat-delete").style.display = "none";
                                                    newMaterial.querySelector("i.edit-mat-minus").style.display = "block";
                                                    option.id = String(Number(option.id.split("-")[0]) + Number(option.id.split("-")[3])) + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                                    materials.forEach(material => {
                                                        if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                            material[1] = option.id.split("-")[0];
                                                        } 
                                                    });
                                                });
                                                newMaterial.querySelector("i.edit-mat-minus").addEventListener("click", () => {
                                                    newMaterial.querySelector(".edit-mat-quan span").innerHTML = String(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) - Number(option.id.split("-")[3])) + newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)
                                                    if(Number(newMaterial.querySelector(".edit-mat-quan span").innerHTML.slice(0, newMaterial.querySelector(".edit-mat-quan span").innerHTML.indexOf("<") - 1)) == 1){
                                                        newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                                        newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                                    }
                                                    option.id = String(Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                                    materials.forEach(material => {
                                                        if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                            material[1] = option.id.split("-")[0];
                                                        } 
                                                    });
                                                    console.log((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])));
                                                    if((Number(option.id.split("-")[0]) - Number(option.id.split("-")[3])) <= 0){
                                                        newMaterial.querySelector("i.edit-mat-minus").style.display = "none";
                                                        newMaterial.querySelector("i.edit-mat-delete").style.display = "block";
                                                    }
                                                });
                                                newMaterial.querySelector("i.edit-mat-delete").addEventListener("click", () => {
                                                    newMaterial.style.maxHeight = "0px";
                                                    newMaterial.style.opacity = "0";
                                                    setTimeout(() => {
                                                        wrapper.querySelector(".edit-mat-col").removeChild(newMaterial);
                                                    }, 300);
                                                    option.classList.remove("edit-mat-active");
                                                    if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                        wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                                    }
                                                    materials.forEach((material, idx) => {
                                                        if(material[0] == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                            materials.splice(idx, 1);
                                                            option.id = option.id.split("-")[2] + "-" + option.id.split("-")[1] + "-" + option.id.split("-")[2] + "-" + option.id.split("-")[3];
                                                        } 
                                                    });
                                                });
            
                                                let newArray = [option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1), option.id.split("-")[0], option.id.split("-")[1]]; 
                                                materials.push(newArray);
                                            } else {
                                                option.classList.remove("edit-mat-active");
                                                document.querySelectorAll(".edit-mat-section").forEach(section => {
                                                    if(section.querySelector(".edit-mat-name").innerHTML == option.innerHTML.slice(0, option.innerHTML.indexOf("<") - 1)){
                                                        section.style.maxHeight = "0px";
                                                        section.style.opacity = "0";
                                                        setTimeout(() => {
                                                            wrapper.querySelector(".edit-mat-col").removeChild(section);
                                                        }, 300);
                                                    }
                                                });
                                                option.classList.remove("edit-mat-active");
                                                if(wrapper.querySelectorAll(".edit-mat-active").length == 0){
                                                    wrapper.querySelector(".edit-mat-col").style.marginTop = "0px";
                                                }
                                            }
                                        });
                                    });
                                }

                            });
                        }
                        getMaterials();

                        document.getElementById("sideQuote").addEventListener("click", () => {
                            document.querySelector(".active-section").classList.remove("active-section");
                            document.getElementById("sideQuote").classList.add("active-section");
                            document.querySelector(".dash-container").style.opacity = "0";
                            document.querySelector(".lac-container").style.opacity = "0";
                            setTimeout(() => {
                                document.querySelector(".quo-container").style.display = "flex";
                                document.querySelector(".dash-container").style.display = "none";
                                document.querySelector(".lac-container").style.display = "none";
                                setTimeout(() => {
                                    document.querySelector(".quo-container").style.opacity = "1";
                                }, 50);
                            }, 300);
                        });
                        document.querySelector(".quo-btn").addEventListener("click", () => {
                            async function getQuote(){
                                let profitMargin = 1.3;
                                if(document.getElementById("quoProfit").value.replace("%", "") != "") profitMargin = (Number(document.getElementById("quoProfit").value.replace("%", "")) / 100) + 1;
                                const dataToSend = { profit: document.getElementById("quoProfit").value.replace("%", ""), time: document.getElementById("quoTime").value.replace("h", ""), materials: materials, charges: charges };
                                try {
                                    const response = await fetch(url + `/api/get-quote`, {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { 
                                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            'Content-Type': 'application/json', 
                                        },
                                        body: JSON.stringify(dataToSend), 
                                    });
    
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Error:', errorData.message);
                                        return;
                                    }
    
                                    const data = await response.json();
                                    document.querySelectorAll(".quo-right-value").forEach((value, idx) => {
                                        if(idx == 0){
                                            value.textContent = "£" + data.labourCost;
                                        }
                                        if(idx == 1){
                                            value.textContent = "£" + Number(data.labourCost * profitMargin).toFixed(2);
                                        }
                                        if(idx == 2){
                                            value.textContent = "£" + data.materialCost;
                                        }
                                        if(idx == 3){
                                            value.textContent = "£" + Number(data.materialCost * profitMargin).toFixed(2);
                                        }
                                        if(idx == 4){
                                            value.textContent = "£" + Number((data.materialCharge + data.labourCost) * profitMargin);
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error posting data:', error);
                                }
                            }
                            getQuote();
                        });

                        document.getElementById("newJobBtn").addEventListener("click", () => {
                            document.querySelector(".active-section").classList.remove("active-section");
                            document.getElementById("sideNewJob").classList.add("active-section");
                            document.querySelector(".dash-container").style.opacity = "0";
                            setTimeout(() => {
                                document.querySelector(".lac-container").style.display = "block";
                                document.querySelector(".dash-container").style.display = "none";
                                setTimeout(() => {
                                    document.querySelector(".lac-container").style.opacity = "1";
                                }, 50);
                            }, 300);
                        });
                        document.querySelector(".lac-back").addEventListener("click", () => {
                            document.querySelector(".active-section").classList.remove("active-section");
                            document.getElementById("sideHome").classList.add("active-section");
                            document.querySelector(".lac-container").style.opacity = "0";
                            setTimeout(() => {
                                document.querySelector(".dash-container").style.display = "block";
                                document.querySelector(".lac-container").style.display = "none";
                                setTimeout(() => {
                                    document.querySelector(".dash-container").style.opacity = "1";
                                }, 50);
                            }, 300);
                        });
                        document.getElementById("sideNewJob").addEventListener("click", () => {
                            document.querySelector(".active-section").classList.remove("active-section");
                            document.getElementById("sideNewJob").classList.add("active-section");
                            document.querySelector(".dash-container").style.opacity = "0";
                            setTimeout(() => {
                                document.querySelector(".lac-container").style.display = "block";
                                document.querySelector(".dash-container").style.display = "none";
                                setTimeout(() => {
                                    document.querySelector(".lac-container").style.opacity = "1";
                                }, 50);
                            }, 300);
                        });
                        document.getElementById("newWorkerBtn").addEventListener("click", () => {
                            document.getElementById("newWorkerModal").style.opacity = "1";
                            document.getElementById("newWorkerModal").style.pointerEvents = "auto";
                        });

                        document.querySelector("#jobDateSelector div").textContent = todayDate.slice(0, 2) + " " + months[Number(todayDate.slice(3, 5)) - 1] + " " + todayDate.slice(6);
                        if(document.querySelector("#jobDateSelector div").textContent.slice(0, 1) == "0") document.querySelector("#jobDateSelector div").textContent = document.querySelector("#jobDateSelector div").textContent.slice(1);
                        document.getElementById("jobDateInput").value = todayDate;

                        document.querySelectorAll(".new-date-selector").forEach(selector => {
                            selector.addEventListener("click", () => {
                                document.querySelector(".date-modal").style.opacity = "1";
                                document.querySelector(".date-modal").style.pointerEvents = "auto";
                            });

                            document.querySelectorAll(".edit-change-col").forEach((col, colIdx) => {
                                col.querySelector(".edit-change-num").textContent = todayDate.split("/")[colIdx];
                                if(col.querySelector(".edit-change-num").textContent.length == 4) col.querySelector(".edit-change-num").textContent = col.querySelector(".edit-change-num").textContent.slice(2);
                            });
                        });
                        document.querySelectorAll(".edit-change-col").forEach((col, colIdx) => {
                            col.querySelectorAll(".edit-change-chev").forEach((chev, idx) => {
                                chev.addEventListener("click", () => {
                                    if(idx == 0){
                                        col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) + 1;
                                        if(Number(col.querySelector(".edit-change-num").textContent) > 31 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "1";
                                        if(Number(col.querySelector(".edit-change-num").textContent) > 12 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "1";
                                        if(Number(col.querySelector(".edit-change-num").textContent) < 25 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "25";
                                    } else {
                                        col.querySelector(".edit-change-num").textContent = Number(col.querySelector(".edit-change-num").textContent) - 1;
                                        if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 0) col.querySelector(".edit-change-num").textContent = "31";
                                        if(Number(col.querySelector(".edit-change-num").textContent) < 1 && colIdx == 1) col.querySelector(".edit-change-num").textContent = "12";
                                        if(Number(col.querySelector(".edit-change-num").textContent) < 10 && colIdx == 2) col.querySelector(".edit-change-num").textContent = "10";
                                    }
                                });
                            });

                            col.querySelector(".edit-change-num").textContent = todayDate.split("/")[colIdx];
                            if(col.querySelector(".edit-change-num").textContent.slice(0, 1) == "0") col.querySelector(".edit-change-num").textContent = col.querySelector(".edit-change-num").textContent.slice(1);
                            if(col.querySelector(".edit-change-num").textContent.length == 4) col.querySelector(".edit-change-num").textContent = col.querySelector(".edit-change-num").textContent.slice(2);
                        });
                        document.querySelector(".btn-change-save").addEventListener("click", () => {
                            document.querySelector(".date-modal").style.opacity = "0";
                            document.querySelector(".date-modal").style.pointerEvents = "none";

                            let day = document.querySelectorAll(".edit-change-num")[0].textContent;
                            if(day.length == 1) day = "0" + day;
                            let month = document.querySelectorAll(".edit-change-num")[1].textContent;
                            if(month.length == 1) month = "0" + month;
                            if(document.getElementById("newJobModal").style.opacity == "1"){
                                document.querySelector("#jobDateSelector div").textContent = document.querySelectorAll(".edit-change-num")[0].textContent + " " + months[Number(document.querySelectorAll(".edit-change-num")[1].textContent - 1)] + " 20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                if(document.querySelector("#jobDateSelector div").textContent.slice(0, 1) == "0") document.querySelector("#jobDateSelector div").textContent = document.querySelector("#jobDateSelector div").textContent.slice(1);
                                document.getElementById("jobDateInput").value = day + "/" + month + "/20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                            } else {
                                document.querySelector("#editDateSelector div").textContent = document.querySelectorAll(".edit-change-num")[0].textContent + " " + months[Number(document.querySelectorAll(".edit-change-num")[1].textContent - 1)] + " 20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                                if(document.querySelector("#editDateSelector div").textContent.slice(0, 1) == "0") document.querySelector("#editDateSelector div").textContent = document.querySelector("#editDateSelector div").textContent.slice(1);
                                document.getElementById("editDateInput").value = day + "/" + month + "/20" + document.querySelectorAll(".edit-change-num")[2].textContent;
                            }
                        });
                        document.querySelector(".btn-change-cancel").addEventListener("click", () => {
                            document.querySelector(".date-modal").style.opacity = "0";
                            document.querySelector(".date-modal").style.pointerEvents = "none";
                        });
                        document.getElementById("newJobForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            let responseData = {};
                            try {
                                const res = await fetch(url + "/api/create-job", {
                                    method: "POST",
                                    credentials: 'include',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                    body: JSON.stringify(data)
                                });

                                responseData = await res.json();
                            } catch(err){
                                let pendingJobs = [];
                                if(localStorage.getItem("pendingJobs") && localStorage.getItem("pendingJobs").includes("[")){
                                    pendingJobs = JSON.parse(localStorage.getItem("pendingJobs"));
                                }
                                pendingJobs.push(data);
                                localStorage.setItem("pendingJobs", JSON.stringify(pendingJobs));
                                responseData.message = "success";
                            }

                            if(responseData.message == "noworker"){
                                document.getElementById("workerError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("workerError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                document.getElementById("newJobModal").style.opacity = "0";
                                document.getElementById("newJobModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankJobCreation").style.opacity = "1";
                                    document.getElementById("thankJobCreation").style.pointerEvents = "auto";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankJobCreation").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });
                        document.getElementById("editJobForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            const res = await fetch(url + "/api/edit-job", {
                                method: "POST",
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                body: JSON.stringify(data)
                            });

                            const responseData = await res.json();
                            if(responseData.message == "noworker"){
                                document.getElementById("editWorkerError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("editWorkerError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                document.getElementById("editJobModal").style.opacity = "0";
                                document.getElementById("editJobModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankJobEdit").style.opacity = "1";
                                    document.getElementById("thankJobEdit").style.pointerEvents = "auto";
                                    document.getElementById("thankJobEdit").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankJobEdit").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });
                        document.getElementById("newWorkerForm").addEventListener("submit", async (e) => {
                            e.preventDefault(); 
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            let responseData = {};
                            try {
                                const res = await fetch(url + "/api/create-worker", {
                                    method: "POST",
                                    credentials: 'include',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                                    body: JSON.stringify(data)
                                });

                                responseData = await res.json();
                            } catch(err){
                                let pendingWorkers = [];
                                if(localStorage.getItem("pendingWorkers") && localStorage.getItem("pendingWorkers").includes("[")){
                                    pendingWorkers = JSON.parse(localStorage.getItem("pendingWorkers"));
                                }
                                pendingWorkers.push(data);
                                localStorage.setItem("pendingWorkers", JSON.stringify(pendingWorkers));
                                responseData.message = "success";
                            }

                            if(responseData.message == "email taken"){
                                document.getElementById("emailError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("emailError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "invalid email"){
                                document.getElementById("invalidError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("invalidError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "failure"){
                                document.getElementById("serverError").style.display = "block";
                                setTimeout(() => {
                                    document.getElementById("serverError").style.display = "none";
                                }, 2000);
                            } else if(responseData.message == "success") {
                                document.getElementById("newWorkerModal").style.opacity = "0";
                                document.getElementById("newWorkerModal").style.pointerEvents = "none";
                                setTimeout(() => {
                                    document.getElementById("thankWorkerCreation").style.opacity = "1";
                                    document.getElementById("thankWorkerCreation").style.pointerEvents = "auto";
                                    document.getElementById("thankWorkerCreation").querySelector(".thank-wrapper").style.opacity = "1";
                                    document.getElementById("thankWorkerCreation").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                }, 300);
                            }
                        });

                        document.querySelectorAll(".new-worker-selector").forEach(selector => {
                            selector.addEventListener("click", () => {
                                document.querySelector(".assign-modal").style.opacity = "1";
                                document.querySelector(".assign-modal").style.pointerEvents = "auto";
                            });
                        });
                        document.querySelectorAll(".admin-table-notes span").forEach((span, idx) => {
                            span.addEventListener("click", () => {
                                document.querySelector(".read-wrapper div").textContent = jobs[idx].job_notes;
                                document.querySelector(".read-modal").style.opacity = "1";
                                document.querySelector(".read-modal").style.pointerEvents = "auto";
                            });
                        });
                        document.querySelector("i.read-close").addEventListener("click", () => {
                            document.querySelector(".read-modal").style.opacity = "0";
                            document.querySelector(".read-modal").style.pointerEvents = "none";
                        });

                        workers.forEach(worker => {
                            let newOption = document.createElement("div");
                            newOption.classList.add("edit-mat-option"); 
                            newOption.id = worker.id;
                            newOption.innerHTML = worker.name + '<i class="fa-solid fa-check"></i>';
                            document.querySelector(".assign-wrapper").appendChild(newOption);
                        });
                        if(workers.length == 0){
                            document.getElementById("assignEmpty").style.display = "block";
                        }
                        document.querySelectorAll(".edit-mat-option").forEach(option => {
                            option.addEventListener("click", () => {
                                let disable = false;
                                if(option.classList.contains("edit-mat-active")){
                                    disable = true;
                                }
                                document.querySelectorAll(".edit-mat-option").forEach(other => {
                                    other.classList.remove("edit-mat-active");
                                });
                                if(!disable){
                                    option.classList.add("edit-mat-active");
                                    if(document.getElementById("newJobModal").style.opacity == "1"){
                                        document.querySelector("#workerSelector div").textContent = option.innerHTML.slice(0, option.innerHTML.indexOf("<"));
                                        document.getElementById("workerInput").value = document.querySelector("#workerSelector div").textContent;
                                        document.getElementById("idInput").value = option.id;
                                    } else {
                                        document.querySelector("#editWorkerSelector div").textContent = option.innerHTML.slice(0, option.innerHTML.indexOf("<"));
                                        document.getElementById("editWorkerInput").value = document.querySelector("#editWorkerSelector div").textContent;
                                        document.getElementById("editIdInput").value = option.id;
                                    }
                                } else {
                                    option.classList.remove("edit-mat-active");
                                    if(document.getElementById("newJobModal").style.opacity == "1"){
                                        document.querySelector("#workerSelector div").textContent = "Select Worker";
                                        document.getElementById("workerInput").value = "";
                                        document.getElementById("idInput").value = "";
                                    } else {
                                        document.querySelector("#editWorkerSelector div").textContent = "Select Worker";
                                        document.getElementById("editWorkerInput").value = "";
                                        document.getElementById("editIdInput").value = "";
                                    }
                                }
                            });
                        });

                        let currentFilters = ["", ""];
                        document.querySelectorAll(".exam-modal-section").forEach(section => {
                            section.querySelectorAll(".exam-modal-box").forEach((box, idx) => {
                                box.addEventListener("click", () => {
                                    section.querySelectorAll(".exam-modal-box").forEach((other, otherIdx) => {
                                        if(otherIdx == idx && !box.classList.contains("exam-modal-box-active")){
                                            box.classList.add("exam-modal-box-active");
                                            box.querySelector("i").classList.add("exam-modal-check-active");
                                        } else {
                                            other.classList.remove("exam-modal-box-active");
                                            other.querySelector("i").classList.remove("exam-modal-check-active");
                                        }
                                    });
                                });
                            });
                        });
                        document.getElementById("saveFilterBtn").addEventListener("click", () => {
                            document.querySelectorAll(".exam-modal-section").forEach((section, idx) => {
                                section.querySelectorAll(".exam-modal-box").forEach((box, boxIdx) => {
                                    if(box.classList.contains("exam-modal-box-active")){
                                        currentFilters[idx] = boxIdx;
                                    }
                                });
                                if(!section.querySelector(".exam-modal-box-active")){
                                    currentFilters[idx] = "";
                                }
                            });

                            let validJobs = 0;
                            jobs.forEach(job => {
                                let allowedDates = [];
                                for(let i = 0; i < 7; i++){
                                    allowedDates.push(getSpecificDate(i));
                                }
                                if(allowedDates.includes(job.job_date)){
                                    let jobRow = document.getElementById(job.id);
                                    let invalid = false;
                                    if(currentFilters[0] === 0){
                                        if(job.job_status == "Pending"){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[0] == 1){
                                        if(job.job_status == "In Progress"){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[0] == 2){
                                        if(job.job_status == "Completed"){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[0] == ""){
                                        jobRow.style.display = "flex";
                                    }
    
                                    if(currentFilters[1] === 0){
                                        if(job.job_date == todayDate){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[1] == 1){
                                        if(job.job_date.slice(3, 5) == todayDate.slice(3, 5)){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[1] == 2){
                                        if(job.job_date.slice(6) == todayDate.slice(6)){
                                            jobRow.style.display = "flex";
                                        } else {
                                            invalid = true;
                                        }
                                    } else if(currentFilters[1] == ""){
                                        jobRow.style.display = "flex";
                                    }
    
                                    if(invalid){
                                        jobRow.style.display = "none";
                                    } else {
                                        validJobs++;
                                    }
                                }
                            });
                            if(validJobs == 0){
                                showNoJobs();
                            } else {
                                document.querySelector(".dash-table-scroll").style.display = "block";
                                document.getElementById("dashEmpty").style.display = "none";
                            }
                            document.getElementById("filterModal").style.opacity = "0";
                            document.getElementById("filterModal").style.pointerEvents = "none";
                        });

                        document.querySelector(".dash-perf-btn").addEventListener("click", () => {
                            currentFrom = document.getElementById("dashPerfFrom").value;
                            currentTo = document.getElementById("dashPerfTo").value;
                            if(currentFrom.length == 10 && currentFrom.includes("/") && currentTo != ""){
                                makeWorkerReport(currentWorker);
                            }
                        });
                        let currentWorker;
                        let currentFrom;
                        let currentTo;
                        function makeWorkerReport(worker){
                            currentWorker = worker;
                            let workerJobs = [];
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && job.job_status == "Completed" && (!currentFrom || isDateBetween(job.job_date, currentFrom, currentTo))) workerJobs.push(job);
                            });

                            let hoursWorked = 0;
                            let minsWorked = 0;
                            let totalJobs = workerJobs.length;
                            let avgSpeed = 0;
                            let avgProfit = 0;
                            let totalProfit = 0;
                            workerJobs.forEach(job => {if(job.job_status == "Completed"){
                                if(job.job_progress.includes("hrs")){
                                    hoursWorked += Number(job.job_progress.slice(0, job.job_progress.indexOf("h") - 1));
                                    minsWorked += Number(job.job_progress.slice(job.job_progress.lastIndexOf("hrs") + 2, job.job_progress.indexOf("m") - 1));
                                    avgSpeed += (Number(job.job_progress.slice(0, job.job_progress.indexOf("h") - 1)) * 60) + Number(job.job_progress.slice(job.job_progress.lastIndexOf("hrs") + 2, job.job_progress.indexOf("m") - 1));
                                } else {
                                    minsWorked += Number(job.job_progress.slice(0, job.job_progress.indexOf("m") - 1));
                                    avgSpeed += Number(job.job_progress.slice(0, job.job_progress.indexOf("m") - 1));
                                }
                                totalProfit += Number(job.job_realcharge.replace("£", "")) - Number(job.job_setback.replace("£", ""));
                            }});
                            hoursWorked += Math.floor(minsWorked / 60);
                            avgProfit = "£" + Number(totalProfit / totalJobs).toFixed(0);
                            avgSpeed = avgSpeed / totalJobs;
                            let avgHours = Math.floor(avgSpeed / 60);
                            let avgMins = avgSpeed % 60;
                            avgSpeed = avgHours + "h " + avgMins + "m";

                            document.querySelectorAll(".rep-worker-num")[0].textContent = hoursWorked;
                            document.querySelectorAll(".rep-worker-num")[1].textContent = totalJobs;
                            document.querySelectorAll(".rep-worker-num")[2].textContent = "£" + totalProfit;
                            document.querySelectorAll(".rep-worker-num")[3].textContent = avgProfit;
                        }
                        function showWorker(worker){
                            let newWrapper = document.querySelector(".work-wrapper");
                            newWrapper.id = "worker-" + worker.id;
    
                            let nextJob = "None upcoming";
                            let jobStyle = "style='display: none;'";
                            let jobHtml = "";
                            let matchCount = 0;
                            let colours = ["48", "68", "88"];
                            let reportBtn = "";
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && matchCount < 3 && isDateFuture(todayDate, job.job_date) && job.job_status != "Completed"){
                                    matchCount++;
                                    if(matchCount == 1) nextJob = job.job_date + " - " + job.job_time;
                                    jobStyle = "";
                                    let newHtml = `
                                        <div class="work-up-li">
                                            <span style="background-color: hsl(211, 22%, ${colours[matchCount - 1]}%);"></span>
                                            <div class="work-up-flex">
                                                <div class="work-up-left">
                                                    <div class="work-up-name">${job.job_name}</div>
                                                    <div class="work-up-btn blue-hover">View Details</div>
                                                </div>
                                                <div class="work-up-date">${job.job_date}</div>
                                            </div>
                                        </div>
                                    `;
                                    jobHtml += newHtml;
                                }
    
                                if(job.user_id == worker.id && job.job_status == "Completed"){
                                    reportBtn = `<div class="work-btn work-report-btn">View Report</div>`;
                                }
                            });
    
                            newWrapper.innerHTML = `
                                <i class="fa-regular fa-trash-can work-delete"></i>
                                <div class="work-top">
                                    <div class="work-pfp"><i class="fa-solid fa-user"></i></div>
                                    <div>
                                        <div class="work-name">${worker.name}</div>
                                        <div class="work-role">${worker.role}</div>
                                    </div>
                                </div>
    
                                <div class="work-ul">
                                    <div class="work-li">
                                        <div class="work-label">Phone</div>
                                        <div class="work-txt">${worker.phone}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Email</div>
                                        <div class="work-txt">${worker.email}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Next Job</div>
                                        <div class="work-txt">${nextJob}</div>
                                    </div>
                                </div>
    
                                <div class="work-up-col" ${jobStyle}>
                                    <div class="work-up-head">Upcoming Jobs</div>
                                    <div class="work-up-ul">
                                        ${jobHtml}
                                    </div>
                                </div>
    
                                <div class="work-btn-flex">
                                    <div class="work-btn work-rate-btn">Edit Rate</div>
                                    ${reportBtn}
                                </div>
                            `;
        
                            newWrapper.querySelectorAll(".work-up-btn").forEach(btn => {
                                btn.addEventListener("click", () => {
                                    document.querySelectorAll(".admin-table-row").forEach(row => {
                                        if(row.id == newWrapper.id.split("-")[1]){
                                            row.style.backgroundColor = "hsla(222, 100%, 58%, 0.05)";
                                            row.style.order = "1";
                                        } else {
                                            row.style.order = "2";
                                        }
                                    });
                                    changePage(0);
                                });
                            });
                            newWrapper.querySelector(".work-rate-btn").addEventListener("click", () => {
                                document.getElementById("newRateModal").style.opacity = "1";
                                document.getElementById("newRateModal").style.pointerEvents = "auto";
                            });
                            document.getElementById("newRateBtn").addEventListener("click", () => {
                                if(document.getElementById("newRateCharge").value == "" || document.getElementById("newRateCost").value == ""){
                                    document.getElementById("newRateError").style.display = "block";
                                    setTimeout(() => {
                                        document.getElementById("newRateError").style.display = "none";
                                    }, 2000);
                                } else {
                                    async function newRate() {
                                        const dataToSend = { charge: document.getElementById("newRateCharge").value.replace("£", ""), cost: document.getElementById("newRateCost").value.replace("£", ""), id: worker.id };
                                        try {
                                            const response = await fetch(url + '/api/new-rate', {
                                                method: 'POST',
                                                credentials: 'include',
                                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                    'Content-Type': 'application/json', 
                                                },
                                                body: JSON.stringify(dataToSend), 
                                            });
        
                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                console.error('Error:', errorData.message);
                                                return;
                                            }
        
                                            const data = await response.json();
                                            if(data.message == "success"){
                                                document.getElementById("newRateModal").style.opacity = "0";
                                                document.getElementById("newRateModal").style.pointerEvents = "none";
                                                setTimeout(() => {
                                                    document.getElementById("thankPrice").style.opacity = "1";
                                                    document.getElementById("thankPrice").style.pointerEvents = "auto";
                                                    document.getElementById("thankPrice").querySelector(".thank-wrapper").style.opacity = "1";
                                                    document.getElementById("thankPrice").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                                }, 300);
                                            }
                                        } catch (error) {
                                            console.error('Error posting data:', error);
                                        }
                                    }
                                    newRate();
                                }
                            });
                            /*
                            newWrapper.querySelector(".work-assign-btn").addEventListener("click", () => {
                                document.getElementById("newJobModal").style.opacity = "1";
                                document.getElementById("newJobModal").style.pointerEvents = "auto";
                                document.getElementById("workerInput").value = worker.name;
                                document.getElementById("idInput").value = worker.id;
                                document.getElementById("jobDateLabel").style.display = "block";
                                document.getElementById("jobDateSelector").style.display = "flex";

                                document.querySelectorAll(".edit-mat-option").forEach(option => {
                                    option.classList.remove("edit-mat-active");
                                });
                            });
                            */
                            if(reportBtn != ""){
                                newWrapper.querySelector(".work-report-btn").addEventListener("click", () => {
                                    makeWorkerReport(worker);
                                    document.getElementById("workerReportModal").style.opacity = "1";
                                    document.getElementById("workerReportModal").style.pointerEvents = "auto";
                                });
                            }

                            newWrapper.querySelector("i.work-delete").addEventListener("click", () => {
                                document.getElementById("deleteWorkerModal").style.opacity = "1";
                                document.getElementById("deleteWorkerModal").style.pointerEvents = "auto";
                                deleteWorkerId = worker.id;
                            });
                            document.getElementById("deleteWorkerModal").querySelector(".btn-book-delete-booking").onclick = () => {
                                async function deleteWorker() {
                                    const dataToSend = { id: deleteWorkerId };
                                    try {
                                        const response = await fetch(url + '/api/delete-worker', {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                'Content-Type': 'application/json', 
                                            },
                                            body: JSON.stringify(dataToSend), 
                                        });

                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            console.error('Error:', errorData.message);
                                            return;
                                        }

                                        const data = await response.json();
                                        if(data.message == "success"){
                                            window.location.reload();
                                        }
                                    } catch (error) {
                                        console.error('Error posting data:', error);
                                    }
                                }
                                deleteWorker();
                            }

                            document.getElementById("deleteWorkerModal").addEventListener("click", (e) => {
                                if(!document.querySelector(".book-delete-wrapper").contains(e.target)){
                                    document.getElementById("deleteWorkerModal").style.opacity = "0";
                                    document.getElementById("deleteWorkerModal").style.pointerEvents = "none";
                                } 
                            });
                            document.getElementById("deleteWorkerModal").querySelector(".btn-book-nodelete").addEventListener("click", () => {
                                document.getElementById("deleteWorkerModal").style.opacity = "0";
                                document.getElementById("deleteWorkerModal").style.pointerEvents = "none";
                            });
                        }
                        if(workers.length == 0){
                            document.getElementById("dashWorkerEmpty").style.display = "block";
                            document.querySelector(".work-wrapper").style.display = "none";
                        } else {
                            showWorker(workers[0]);
                        }
                        document.getElementById("repWorkerSearch").addEventListener("input", () => {
                            document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repWorkerSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repWorkerSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            showWorker(worker);
                                            document.querySelector("#repWorkerSearch input").value = worker.name;
                                            document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repWorkerSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });

                        document.querySelector(".admin-filter-btn").addEventListener("click", () => {
                            document.getElementById("filterModal").style.opacity = "1";
                            document.getElementById("filterModal").style.pointerEvents = "auto";
                        });

                        document.querySelectorAll(".admin-table-notes span").forEach((span, idx) => {
                            span.addEventListener("click", () => {
                                document.querySelector(".read-modal").style.opacity = "1";
                                document.querySelector(".read-modal").style.pointerEvents = "auto";
                            });
                        });
                        document.querySelector("i.read-close").addEventListener("click", () => {
                            document.querySelector(".read-modal").style.opacity = "0";
                            document.querySelector(".read-modal").style.pointerEvents = "none";
                        });

                        document.querySelectorAll("i.admin-edit-icon").forEach((icon, idx) => {
                            icon.addEventListener("click", () => {
                                let editJob = jobs[idx];
                                document.getElementById("editName").value = editJob.job_name;
                                document.getElementById("editCustomerName").value = editJob.job_customer;
                                document.getElementById("editCustomerAddress").value = editJob.job_address;
                                document.querySelector("#editDateSelector div").textContent = editJob.job_date.slice(0, 2) + " " + months[Number(editJob.job_date.slice(3, 5)) - 1] + " " + editJob.job_date.slice(-4);
                                if(document.querySelector("#editDateSelector div").textContent.slice(0, 1) == "0") document.querySelector("#editDateSelector div").textContent = document.querySelector("#editDateSelector div").textContent.slice(1);
                                document.getElementById("editDateInput").value = editJob.job_date;
                                document.getElementById("editCost").value = editJob.job_cost;
                                document.getElementById("editTime").value = editJob.job_time;
                                document.querySelector("#editWorkerSelector div").textContent = editJob.job_worker;
                                document.getElementById("editWorkerInput").value = editJob.job_worker;
                                document.getElementById("editIdInput").value = editJob.user_id;
                                document.querySelectorAll(".edit-mat-option").forEach(option => {
                                    if(option.id == editJob.user_id){
                                        option.classList.add("edit-mat-active");
                                    }
                                });
                                document.getElementById("jobId").value = editJob.id;

                                document.getElementById("editJobModal").style.opacity = "1";
                                document.getElementById("editJobModal").style.pointerEvents = "auto";
                            });
                        });
                        let deleteId;
                        document.querySelectorAll("i.admin-delete-icon").forEach((icon, idx) => {
                            icon.addEventListener("click", () => {
                                document.getElementById("deleteJob").style.opacity = "1";
                                document.getElementById("deleteJob").style.pointerEvents = "auto";
                                deleteId = jobs[idx].id;
                            });
                        });
                        document.querySelectorAll(".admin-table-icon").forEach((group, idx) => {
                            group.querySelectorAll("i.admin-report-icon").forEach((icon) => {
                                icon.addEventListener("click", () => {
                                    dashMakeJobReport(jobs[idx]);
                                    document.getElementById("jobReportModal").style.opacity = "1";
                                    document.getElementById("jobReportModal").style.pointerEvents = "auto";
                                });
                            });
                        });

                        document.querySelector(".btn-book-delete-booking").addEventListener("click", () => {
                            async function deleteJob() {
                                const dataToSend = { jobId: deleteId };
                                try {
                                    const response = await fetch(url + '/api/delete-job', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            'Content-Type': 'application/json', 
                                        },
                                        body: JSON.stringify(dataToSend), 
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Error:', errorData.message);
                                        return;
                                    }

                                    const data = await response.json();
                                    if(data.message == "success"){
                                        document.getElementById("deleteJob").style.opacity = "0";
                                        document.getElementById("deleteJob").style.pointerEvents = "none";
                                        setTimeout(() => {
                                            document.getElementById("thankDelete").style.opacity = "1";
                                            document.getElementById("thankDelete").style.pointerEvents = "auto";
                                            document.getElementById("thankDelete").querySelector(".thank-wrapper").style.opacity = "1";
                                            document.getElementById("thankDelete").querySelector(".thank-wrapper").style.transform = "scale(1)";
                                        }, 300);
                                    }
                                } catch (error) {
                                    console.error('Error posting data:', error);
                                }
                            }
                            deleteJob();
                        });
                        document.querySelector(".btn-book-nodelete").addEventListener("click", () => {
                            document.getElementById("deleteJob").style.opacity = "0";
                            document.getElementById("deleteJob").style.pointerEvents = "none";
                        });

                        document.querySelectorAll(".admin-material-element").forEach((el, idx) => {
                            if(el.querySelector(".admin-material-btn")){
                                el.querySelector(".admin-material-btn").addEventListener("click", () => {
                                    document.querySelector("#materialModal .new-col").innerHTML = "";
                                    let matJob = jobs[idx];
                                    let jobMaterials = matJob.job_materials.split(",,");
                                    jobMaterials.forEach(mat => {
                                        let matRow;
                                        prices.forEach(row => {
                                            if(row.area == "materials"){
                                                if(mat.split("-")[0] == row.name){
                                                    matRow = row;
                                                }
                                            }
                                        });
                                        if(matRow){
                                            let newWrapper = document.createElement("div");
                                            newWrapper.classList.add("mat-wrapper");
                                            newWrapper.innerHTML = `
                                                <div class="mat-amount">${mat.split("-")[1]} used</div>
                                                <div class="mat-name">${mat.split("-")[0]}</div>
                                                <div class="mat-flex">
                                                    <div class="mat-cost">Cost: <span>£${matRow.cost}</span></div>
                                                    <div class="mat-cost">Charged: <span>£${matRow.charge}</span></div>
                                                </div>
                                            `;
                                            document.querySelector("#materialModal .new-col").appendChild(newWrapper);
                                        }
                                    });

                                    document.getElementById("materialModal").style.opacity = "1";
                                    document.getElementById("materialModal").style.pointerEvents = "auto";
                                });
                            }
                        });

                        document.getElementById("sideNoti").innerHTML = `
                            <i class="fa-solid fa-bell side-icon"></i>
                            <div class="side-txt">Notifications</div>
                            <div class="dash-noti-drop">
                                <div class="noti-top">
                                    <div class="noti-head">Notifications</div>
                                    <div class="noti-mark">Mark as read</div>
                                </div>
                    
                                <div class="noti-ul">
                                    <!-- 
                                    <div class="noti-li">
                                        <div class="noti-dot"></div>
                                        <div class="noti-col">
                                            <div class="noti-txt">Your password has been successfully changed.</div>
                                            <div class="noti-date">Dec 25, 2025 at 08:32am</div>
                                        </div>
                                        <i class="fa-solid fa-lock noti-icon"></i>
                                    </div>
                                    <div class="noti-li">
                                        <div class="noti-dot"></div>
                                        <div class="noti-col">
                                            <div class="noti-txt">You have been assigned to a new job.</div>
                                            <div class="noti-date">Dec 12, 2025 at 11:32am</div>
                                        </div>
                                        <i class="fa-solid fa-location-dot noti-icon"></i>
                                    </div>
                                    <div class="noti-li" style="border-bottom: 0; padding-bottom: 0;">
                                        <div class="noti-dot"></div>
                                        <div class="noti-col">
                                            <div class="noti-txt">Your monthly report has been updated.</div>
                                            <div class="noti-date">Dec 01, 2025 at 04:14pm</div>
                                        </div>
                                        <i class="fa-solid fa-chart-line noti-icon"></i>
                                    </div>
                                    -->
                                    <div class="emp-wrapper" id="notiEmpty">
                                        <img src="images/nodata.svg" class="emp-icon" style="width: 200px;" />
                                        <div class="emp-head">No Notifications</div>
                                        <div class="emp-para">We couldn't find any notifications<br> for you. Try again later.</div>
                                    </div>
                                </div>
                            </div>
                        `;
                        async function getAdminNotis() {
                            try {
                                const response = await fetch(`${url}/api/admin-notis`, {
                                    method: 'GET',
                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                                    credentials: 'include'
                                });
                                const data = await response.json(); 
                                if(data.message == "success"){
                                    let adminNotis = data.notis;
                                    let newNotis = 0;
                                    let anyNotis = 0;
                                    adminNotis.forEach((noti, idx) => {
                                        let newNoti = document.createElement("div");
                                        newNoti.classList.add("noti-li");
                                        let readStr = "style='display: none;'";
                                        if(noti.status == "unread"){
                                            readStr = "";
                                            newNotis++;
                                        }
                                        let iconStr;
                                        if(noti.type == "job"){
                                            iconStr = "fa-solid fa-location-dot";
                                        } else if(noti.type == "finished"){
                                            iconStr = "fa-solid fa-flag-checkered";
                                        } else if(noti.type == "password"){
                                            iconStr = "fa-solid fa-lock";
                                        }
                                        newNoti.innerHTML = `
                                            <div class="noti-dot" ${readStr}></div>
                                            <div class="noti-col">
                                                <div class="noti-txt">${noti.title}</div>
                                                <div class="noti-date">${noti.full_date}</div>
                                            </div>
                                            <i class="${iconStr} noti-icon"></i>
                                        `;
                                        if(idx == adminNotis.length - 1){
                                            newNoti.style.paddingBottom = "0px";
                                            newNoti.style.borderBottom = "0px";
                                        }
                                        document.querySelector(".noti-ul").appendChild(newNoti);
                                        anyNotis++;
                                    });
                                    if(newNotis == 0){
                                        //document.querySelector(".noti-red").style.display = "none";
                                    } else {
                                        //document.querySelector(".noti-red").textContent = newNotis;
                                    }
                                    if(anyNotis == 0){
                                        document.getElementById("notiEmpty").style.display = "block";
                                    } else {
                                        document.getElementById("notiEmpty").style.display = "none";
                                    }
                                    document.querySelector(".noti-mark").addEventListener("click", () => {
                                        document.querySelectorAll(".noti-dot").forEach(dot => {
                                            dot.style.display = "none";
                                        });
                                    });

                                    document.getElementById("sideNoti").addEventListener("click", () => {
                                        document.querySelector(".dash-noti-drop").style.opacity = "1";
                                        document.querySelector(".dash-noti-drop").style.pointerEvents = "auto";

                                        async function markRead() {
                                            const dataToSend = { perms: userData.perms };
                                            try {
                                                const response = await fetch(url + '/api/mark-read', {
                                                    method: 'POST',
                                                    credentials: 'include',
                                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                                        'Content-Type': 'application/json', 
                                                    },
                                                    body: JSON.stringify(dataToSend), 
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    console.error('Error:', errorData.message);
                                                    return;
                                                }

                                                const data = await response.json();
                                            } catch (error) {
                                                console.error('Error posting data:', error);
                                            }
                                        }
                                        markRead();
                                    });
                                }
                            } catch (error) {
                                console.error('Error fetching data:', error);
                            }
                        }
                        getAdminNotis();

                        document.getElementById("sideLog").addEventListener("click", () => {
                            async function logout() {
                                try {
                                    const response = await fetch(`${url}/api/logout`, {
                                        method: 'GET',
                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, },
                                        credentials: 'include'
                                    });
                                    const data = await response.json(); 
                                    if(data.message == "success"){
                                        localStorage.clear(); 
                                        window.location.href = gitName + "/login.html";
                                    } 
                                } catch (error) {
                                    console.error('Error fetching data:', error);
                                }
                            }
                            logout();
                        });

                        document.querySelectorAll(".dash-toggle-option").forEach((option, idx) => {
                            option.addEventListener("click", () => {
                                let toggleOptions = ["left", "mid", "right"];
                                let calcOptions = ["daily", "weekly", "monthly"];
                                document.querySelector(".dash-toggle span").classList.remove("dash-toggle-left");
                                document.querySelector(".dash-toggle span").classList.remove("dash-toggle-mid");
                                document.querySelector(".dash-toggle span").classList.remove("dash-toggle-right");
                                document.querySelector(".dash-toggle span").classList.add("dash-toggle-" + toggleOptions[idx]);
                                calcProfits(calcOptions[idx]);
                                document.querySelectorAll(".dash-toggle-option").forEach((opt, optIdx) => {
                                    opt.style.color = "hsl(0, 0%, 20%)";
                                    if(optIdx == idx) opt.style.color = "white";
                                });
                            });
                        });

                        /* modal click outs */
                        document.querySelectorAll(".new-modal").forEach(modal => {
                            modal.addEventListener("click", (e) => {
                                if(!modal.querySelector(".new-wrapper, .rep-job-wrapper").contains(e.target)){
                                    modal.style.opacity = "0";
                                    modal.style.pointerEvents = "none";
                                }
                            });
                            modal.querySelector("i.new-xmark").addEventListener("click", () => {
                                modal.style.opacity = "0";
                                modal.style.pointerEvents = "none";
                            });
                        });
                        document.addEventListener("click", (e) => {
                            let notClicked = true;
                            document.querySelectorAll(".admin-table-notes span").forEach(span => {
                                if(span.contains(e.target)) notClicked = false;
                            });
                            if(notClicked){
                                document.querySelector(".read-modal").style.opacity = "0";
                                document.querySelector(".read-modal").style.pointerEvents = "none";
                            }

                            if(!document.getElementById("sideNoti").contains(e.target)){
                                document.querySelector(".dash-noti-drop").style.opacity = "0";
                                document.querySelector(".dash-noti-drop").style.pointerEvents = "none";
                            }

                            if(!document.querySelector("#repWorkerSearch").contains(e.target)){
                                document.querySelector("#repWorkerSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.querySelector("#repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector(".date-modal").addEventListener("click", (e) => {
                            if(!document.querySelector(".new-change").contains(e.target)){
                                document.querySelector(".date-modal").style.opacity = "0";
                                document.querySelector(".date-modal").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector(".assign-modal").addEventListener("click", (e) => {
                            if(!document.querySelector(".assign-wrapper").contains(e.target)){
                                document.querySelector(".assign-modal").style.opacity = "0";
                                document.querySelector(".assign-modal").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("i.assign-close").addEventListener("click", () => {
                            document.querySelector(".assign-modal").style.opacity = "0";
                            document.querySelector(".assign-modal").style.pointerEvents = "none";
                        });
                        document.querySelector("#repWorkerSearch input").addEventListener("focus", () => {
                            document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML = "";
                            let newValue = document.querySelector("#repWorkerSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.getElementById("repWorkerSearch").querySelector(".search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            showWorker(worker);
                                            document.querySelector("#repWorkerSearch input").value = worker.name;
                                            document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                            document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.getElementById("repWorkerSearch").querySelector(".search-drop").innerHTML != ""){
                                    document.getElementById("repWorkerSearch").classList.add("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "1";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                    document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.getElementById("repWorkerSearch").classList.remove("search-selector-dropped");
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.opacity = "0";
                                document.getElementById("repWorkerSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                    }

                    /*/////////////// ELEMENT ONLY ////////////////*/
                    if(document.getElementById("calModal")){
                        document.querySelector("#calSearch").addEventListener("input", () => {
                            document.querySelector("#calSearch .search-drop").innerHTML = "";
                            let newValue = document.querySelector("#calSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.querySelector("#calSearch .search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            let jobWrapper;
                                            document.querySelectorAll(".work-wrapper").forEach(wrapper => {
                                                if(wrapper.id.split("-")[1] == worker.id){
                                                    jobWrapper = wrapper;
                                                }
                                            });
                                            if(jobWrapper){
                                                document.getElementById("workerEmpty").style.display = "none";
                                                jobWrapper.style.display = "block";
                                                jobWrapper.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center"
                                                });
                                            }
                                            document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                            document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                            document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.querySelector("#calSearch .search-drop").innerHTML != ""){
                                    document.querySelector("#calSearch").classList.add("search-selector-dropped");
                                    document.querySelector("#calSearch .search-drop").style.opacity = "1";
                                    document.querySelector("#calSearch .search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                    document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                    document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                            }
                        });

                        let workerCount = 0;
                        workers.forEach(worker => {
                            let newWrapper = document.createElement("div");
                            newWrapper.classList.add("work-wrapper");
                            newWrapper.id = "worker-" + worker.id;

                            let nextJob = "None upcoming";
                            let matchCount = 0;
                            jobs.forEach(job => {
                                if(job.user_id == worker.id && matchCount < 3 && isDateFuture(todayDate, job.job_date) && job.job_status != "Completed"){
                                    matchCount++;
                                    if(matchCount == 1) nextJob = job.job_date + " - " + job.job_time;
                                }
                            });

                            newWrapper.innerHTML = `
                                <div class="work-top">
                                    <div class="work-pfp"><i class="fa-solid fa-user"></i></div>
                                    <div>
                                        <div class="work-name">${worker.name}</div>
                                        <div class="work-role">${worker.role}</div>
                                    </div>
                                </div>

                                <div class="work-ul">
                                    <div class="work-li">
                                        <div class="work-label">Phone</div>
                                        <div class="work-txt">${worker.phone}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Email</div>
                                        <div class="work-txt">${worker.email}</div>
                                    </div>
                                    <div class="work-li">
                                        <div class="work-label">Next Job</div>
                                        <div class="work-txt">${nextJob}</div>
                                    </div>
                                </div>
                            `;
                            document.querySelector(".cal-work-col").appendChild(newWrapper);
                            workerCount++;
                            if(workerCount == 6){
                                newWrapper.style.display = "none";
                            }

                            /*
                            newWrapper.querySelector(".work-assign-btn").addEventListener("click", () => {
                                document.getElementById("adminJobModal").querySelector(".jobdateinput").value = document.querySelector(".cal-date-active").id.split("-")[1];
                                document.getElementById("adminJobModal").querySelector(".workerinput").value = worker.name;
                                document.getElementById("adminJobModal").querySelector(".idinput").value = worker.id;
                                document.getElementById("adminJobModal").style.opacity = "1";
                                document.getElementById("adminJobModal").style.pointerEvents = "auto";
                            });
                            */
                        });
                        if(document.getElementById("calModal").querySelectorAll(".work-wrapper").length == 0){
                            document.getElementById("workerEmpty").style.display = "block";
                        }

                        for(let i = 0; i > -365; i--){
                            let newDate = getSpecificDate(i);
                            let newEl = document.createElement("div");
                            newEl.classList.add("cal-date");
                            newEl.id = "date-" + newDate;
                            if(i == 0) newEl.classList.add("cal-date-active");
                            newEl.innerHTML = `
                                <div>${shortMonths[(newDate.split("/")[1] - 1)]}</div>
                                <span>${newDate.split("/")[0]}</span>
                            `;
                            document.querySelector(".cal-flex").appendChild(newEl);
                        }
                        document.querySelectorAll(".cal-date").forEach(date => {
                            date.addEventListener("click", () => {
                                document.querySelectorAll(".cal-date").forEach(other => {
                                    other.classList.remove("cal-date-active"); 
                                });
                                date.classList.add("cal-date-active");
                            });
                        });
                        document.querySelectorAll(".cal-chev").forEach((chev, idx) => {
                            chev.addEventListener("click", () => {
                                let scroll = 200;
                                if(idx == 0){
                                    scroll = -200;
                                }
                                document.querySelector(".cal-flex").scrollBy({
                                    left: scroll,
                                    behavior: "smooth"
                                });
                            });
                        });

                        if(document.querySelector(".cal-back")){
                            document.querySelector(".cal-back").addEventListener("click", () => {
                                document.getElementById("calModal").style.opacity = "0";
                                document.getElementById("calModal").style.pointerEvents = "none";
                                document.getElementById("calModal").style.left = "255px";
                            });
                        }

                        /*///////// MODAL CLICKOUTS ////////*/
                        document.addEventListener("click", (e) => {
                            if(!document.querySelector("#calSearch").contains(e.target)){
                                document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#calSearch").querySelector(".search-drop").style.opacity = "0";
                                document.querySelector("#calSearch").querySelector(".search-drop").style.pointerEvents = "none";
                            }
                        });
                        document.querySelector("#calSearch input").addEventListener("focus", () => {
                            document.querySelector("#calSearch .search-drop").innerHTML = "";
                            let newValue = document.querySelector("#calSearch input").value;
                            if(newValue.length > 0 && jobs){
                                workers.forEach(worker => {
                                    if(worker.name.toLowerCase().includes(newValue.toLowerCase())){
                                        let newOption = document.createElement("div");
                                        newOption.classList.add("search-option");
                                        let lowerValue = newValue.toLowerCase();
                                        let lowerJob = worker.name.toLowerCase();
                                        let firstIdx = lowerJob.indexOf(lowerValue);
                                        let lastIdx = firstIdx + (lowerValue.length - 1);
                                        let higherJob = lowerJob.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                                        let finalOption = higherJob.slice(0, firstIdx) + "<span>" + higherJob.slice(firstIdx, lastIdx + 1) + "</span>" + higherJob.slice(lastIdx + 1);
                                        newOption.innerHTML = finalOption;
                                        document.querySelector("#calSearch .search-drop").appendChild(newOption);

                                        newOption.addEventListener("click", () => {
                                            let jobWrapper;
                                            document.querySelectorAll(".work-wrapper").forEach(wrapper => {
                                                if(wrapper.id.split("-")[1] == worker.id){
                                                    jobWrapper = wrapper;
                                                }
                                            });
                                            if(jobWrapper){
                                                document.getElementById("workerEmpty").style.display = "none";
                                                jobWrapper.style.display = "block";
                                                jobWrapper.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center"
                                                });
                                            }
                                            document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                            document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                            document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                                        });
                                    }
                                });
                                if(document.querySelector("#calSearch .search-drop").innerHTML != ""){
                                    document.querySelector("#calSearch").classList.add("search-selector-dropped");
                                    document.querySelector("#calSearch .search-drop").style.opacity = "1";
                                    document.querySelector("#calSearch .search-drop").style.pointerEvents = "auto";
                                } else {
                                    document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                    document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                    document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                                }
                            } else {
                                document.querySelector("#calSearch").classList.remove("search-selector-dropped");
                                document.querySelector("#calSearch .search-drop").style.opacity = "0";
                                document.querySelector("#calSearch .search-drop").style.pointerEvents = "none";
                            }
                        });
                    }
                    /*/////////////////////////////////////////////*/
                } catch (error) {
                    console.log("www!");
                    console.error('Error fetching data:', error);
                }
            }
            getAdminData();
        } 

        else if(userData && userData.perms == "admin") {
            if(isMobile && window.innerWidth < 1260){
                window.location.href = gitName + "/admin.html?admin=true";
            } else {
                window.location.href = gitName + "/dashboard.html?admin=true";
            }
        }
        /*//////////////////////////////////////*/


        /*/////////////// ELEMENT ONLY ////////////////*/
        if(document.querySelector("i.home-noti")){
            document.querySelectorAll("i.home-noti").forEach(bell => {
                bell.innerHTML = `
                    <div class="noti-red">3</div>
                    <div class="noti-drop">
                        <div class="noti-top">
                            <div class="noti-head">Notifications</div>
                            <div class="noti-mark">Mark as read</div>
                        </div>
            
                        <div class="noti-ul">
                            <!-- 
                            <div class="noti-li">
                                <div class="noti-dot"></div>
                                <div class="noti-col">
                                    <div class="noti-txt">Your password has been successfully changed.</div>
                                    <div class="noti-date">Dec 25, 2025 at 08:32am</div>
                                </div>
                                <i class="fa-solid fa-lock noti-icon"></i>
                            </div>
                            <div class="noti-li">
                                <div class="noti-dot"></div>
                                <div class="noti-col">
                                    <div class="noti-txt">You have been assigned to a new job.</div>
                                    <div class="noti-date">Dec 12, 2025 at 11:32am</div>
                                </div>
                                <i class="fa-solid fa-location-dot noti-icon"></i>
                            </div>
                            <div class="noti-li" style="border-bottom: 0; padding-bottom: 0;">
                                <div class="noti-dot"></div>
                                <div class="noti-col">
                                    <div class="noti-txt">Your monthly report has been updated.</div>
                                    <div class="noti-date">Dec 01, 2025 at 04:14pm</div>
                                </div>
                                <i class="fa-solid fa-chart-line noti-icon"></i>
                            </div>
                            -->
                            <div class="emp-wrapper" id="notiEmpty">
                                <img src="images/nodata.svg" class="emp-icon" style="width: 200px;" />
                                <div class="emp-head">No Notifications</div>
                                <div class="emp-para">We couldn't find any notifications<br> for you. Try again later.</div>
                            </div>
                        </div>
                    </div>
                `;
    
                let newNotis = 0;
                let anyNotis = 0;
                userData.notifications.forEach((noti, idx) => {
                    let newNoti = document.createElement("div");
                    newNoti.classList.add("noti-li");
                    let readStr = "style='display: none;'";
                    if(noti.status == "unread"){
                        readStr = "";
                        newNotis++;
                    }
                    let iconStr;
                    if(noti.type == "job"){
                        iconStr = "fa-solid fa-location-dot";
                    } else if(noti.type == "finished"){
                        iconStr = "fa-solid fa-flag-checkered";
                    } else if(noti.type == "password"){
                        iconStr = "fa-solid fa-lock";
                    }
                    newNoti.innerHTML = `
                        <div class="noti-dot" ${readStr}></div>
                        <div class="noti-col">
                            <div class="noti-txt">${noti.title}</div>
                            <div class="noti-date">${noti.full_date}</div>
                        </div>
                        <i class="${iconStr} noti-icon"></i>
                    `;
                    if(idx == userData.notifications.length - 1){
                        newNoti.style.paddingBottom = "0px";
                        newNoti.style.borderBottom = "0px";
                    }
                    bell.querySelector(".noti-ul").appendChild(newNoti);
                    anyNotis++;
                });
                if(newNotis == 0){
                    bell.querySelector(".noti-red").style.display = "none";
                } else {
                    bell.querySelector(".noti-red").textContent = newNotis;
                }
                if(anyNotis == 0){
                    bell.querySelector("#notiEmpty").style.display = "block";
                } else {
                    bell.querySelector("#notiEmpty").style.display = "none";
                }
                bell.querySelector(".noti-mark").addEventListener("click", () => {
                    bell.querySelectorAll(".noti-dot").forEach(dot => {
                        dot.style.display = "none";
                    });
                });
    
                bell.addEventListener("click", () => {
                    bell.querySelector(".noti-drop").style.opacity = "1";
                    bell.querySelector(".noti-drop").style.pointerEvents = "auto";
    
                    async function markRead() {
                        const dataToSend = { perms: userData.perms };
                        try {
                            const response = await fetch(url + '/api/mark-read', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
                                    'Content-Type': 'application/json', 
                                },
                                body: JSON.stringify(dataToSend), 
                            });
    
                            if (!response.ok) {
                                const errorData = await response.json();
                                console.error('Error:', errorData.message);
                                return;
                            }
    
                            const data = await response.json();
                        } catch (error) {
                            console.error('Error posting data:', error);
                        }
                    }
                    markRead();
                });
    
                document.addEventListener("click", (e) => {
                    if(!bell.querySelector(".noti-drop").contains(e.target) && !bell.contains(e.target)){
                        bell.querySelector(".noti-drop").style.opacity = "0";
                        bell.querySelector(".noti-drop").style.pointerEvents = "none";
                    }
                });
            });
        }
        /*/////////////////////////////////////////////*/

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
getUserData();
