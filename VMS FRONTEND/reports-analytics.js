// reports-analytics.js
// Connected with Express backend + Supabase PostgreSQL
// Uses JWT from login

const API_BASE = "http://localhost:5000/api/analytics";

let currentPeriod = "weekly";


// =============================
// JWT TOKEN
// =============================

function getToken() {

    return localStorage.getItem("token");

}



// =============================
// AUTHENTICATED API CALL
// =============================

async function apiFetch(url) {


    const token = getToken();


    if (!token) {

        throw new Error("No JWT token found. Please login again.");

    }


    const response = await fetch(url, {

        method: "GET",

        headers: {

            "Authorization": `Bearer ${token}`,

            "Content-Type": "application/json"

        }

    });



    const result = await response.json();


    console.log("API URL:", url);
    console.log("API RESPONSE:", result);



    if (!response.ok) {

        throw new Error(
            result.message || 
            `Request failed ${response.status}`
        );

    }



    // Backend success() wrapper support
    return result.data || result;

}



// =============================
// PERIOD BUTTONS
// =============================

function renderPeriodToggle(){


    const periods = [
        "daily",
        "weekly",
        "monthly"
    ];


    const el = document.getElementById(
        "periodToggle"
    );


    el.innerHTML = periods.map(period => `

        <button 
            class="period-btn ${period === currentPeriod ? "active":""}"
            data-period="${period}"
            type="button">

            ${period.charAt(0).toUpperCase()+period.slice(1)}

        </button>

    `).join("");



    el.querySelectorAll(".period-btn")
    .forEach(btn=>{


        btn.addEventListener(
            "click",
            async()=>{


                currentPeriod =
                btn.dataset.period;



                document
                .querySelectorAll(".period-btn")
                .forEach(b=>
                    b.classList.remove("active")
                );


                btn.classList.add("active");


                await loadVisitorsChart();


            }
        );


    });


}



// =============================
// BAR CHART
// =============================

function renderBarChart(
    id,
    labels,
    values,
    highlight=false
){


    const el =
    document.getElementById(id);



    if(!labels || !values)
        return;



    const max =
    Math.max(...values,1);



    el.innerHTML =
    labels.map((label,index)=>{


        const height =
        Math.max(
            6,
            Math.round(
                (values[index]/max)*100
            )
        );



        const peak =
        highlight && values[index]===max
        ? "peak"
        :"";



        return `

        <div class="bar-col">

            <div 
            class="bar ${peak}"
            style="height:${height}%">
            </div>


            <span class="bar-label">
                ${label}
            </span>

        </div>

        `;


    }).join("");

}



// =============================
// VISITOR CHART
// =============================

async function loadVisitorsChart(){


    const data =
    await apiFetch(
        `${API_BASE}/visitors-chart?period=${currentPeriod}`
    );



    document.getElementById(
        "weeklyCardTitle"
    ).textContent =
    `${currentPeriod.charAt(0).toUpperCase()+currentPeriod.slice(1)} Visitors`;



    document.getElementById(
        "weeklyDateRange"
    ).textContent =
    data.rangeLabel || "";



    renderBarChart(

        "weeklyChart",

        data.labels,

        data.data

    );


}




// =============================
// PEAK HOURS
// =============================

async function loadPeakHours(){


    const data =
    await apiFetch(
        `${API_BASE}/peak-hours`
    );



    document.getElementById(
        "peakSubtitle"
    ).textContent =
    "Average daily distribution";



    renderBarChart(

        "peakChart",

        data.labels,

        data.data,

        true

    );



    document.getElementById(
        "peakCaption"
    ).textContent =
    `Peak hour: ${data.peakHour} (${data.peakCount} visitors)`;


}




// =============================
// VISITOR CATEGORIES
// =============================

async function loadCategories(){


    const data =
    await apiFetch(
        `${API_BASE}/categories`
    );



    const el =
    document.getElementById(
        "categoryBars"
    );



    el.innerHTML =
    data.categories.map(category=>{


        return `

        <div class="category-row">


            <div class="cat-top">


                <span class="cat-name">

                    ${category.label}

                </span>



                <span class="cat-count">

                    ${category.count}
                    (${category.percentage}%)

                </span>


            </div>



            <div class="cat-track">

                <div 
                class="cat-fill"
                style="width:${category.percentage}%">
                </div>


            </div>


        </div>

        `;


    }).join("");



}





// =============================
// STAT CARDS
// =============================

async function loadStats(){


    const overview =
    await apiFetch(
        `${API_BASE}/overview`
    );



    const delivery =
    await apiFetch(
        `${API_BASE}/deliveries`
    );



    const stats = [


        {
            label:"Today Visitors",
            value:overview.todayVisitors
        },


        {
            label:"Weekly Visitors",
            value:overview.weeklyVisitors
        },


        {
            label:"Monthly Visitors",
            value:overview.monthlyVisitors
        },


        {
            label:"Departments",
            value:overview.totalDepartments
        },


        {
            label:"Hosts",
            value:overview.totalHosts
        },


        {
            label:"Deliveries",
            value:delivery.totalDeliveries
        }


    ];



    document.getElementById(
        "statGrid"
    ).innerHTML =


    stats.map(stat=>`

        <div class="stat-box">


            <div class="value">

                ${stat.value ?? 0}

            </div>


            <div class="label">

                ${stat.label}

            </div>


        </div>


    `).join("");



}





// =============================
// EXPORT CSV
// =============================

async function exportReport(){


    const token =
    getToken();



    const response =
    await fetch(

        `${API_BASE}/export`,

        {

            headers:{

                "Authorization":
                `Bearer ${token}`

            }

        }

    );



    if(!response.ok){

        alert("Export failed");

        return;

    }



    const blob =
    await response.blob();



    const url =
    window.URL.createObjectURL(blob);



    const a =
    document.createElement("a");



    a.href=url;

    a.download =
    "visits_report.csv";


    a.click();



    window.URL.revokeObjectURL(url);



}




// =============================
// LOAD PAGE
// =============================

async function loadReports(){


    try{


        renderPeriodToggle();



        await Promise.all([


            loadVisitorsChart(),

            loadPeakHours(),

            loadCategories(),

            loadStats()


        ]);



        document.getElementById(
            "lastUpdated"
        ).textContent =

        `Last updated: ${new Date().toLocaleString()}`;



        document.getElementById(
            "exportBtn"
        )
        .addEventListener(
            "click",
            exportReport
        );



    }
    catch(error){


        console.error(
            "Analytics Error:",
            error
        );



        document.querySelector(
            ".content"
        ).innerHTML = `

        <p style="
        color:red;
        text-align:center;
        padding:20px">

        Failed loading analytics.<br>
        ${error.message}

        </p>

        `;


    }


}



document.addEventListener(
    "DOMContentLoaded",
    loadReports
);