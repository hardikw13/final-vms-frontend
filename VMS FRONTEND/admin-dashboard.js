// admin-dashboard.js
// Connected with backend API + Prisma database


const API_URL = "http://localhost:5000/api/admin-dashboard";



// -----------------------------
// ICONS
// -----------------------------

const ICONS = {

users:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.3 0-9 1.66-9 5v3h18v-3c0-3.34-5.7-5-9-5Z"
fill="currentColor"/>
</svg>
`,


visitors:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4Zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z"
fill="currentColor"/>
</svg>
`,


reports:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
fill="currentColor"/>
</svg>
`,


bell:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Z"
fill="currentColor"/>
</svg>
`,


departments:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M3 21V8l9-5 9 5v13h-6v-6h-6v6Z"
fill="currentColor"/>
</svg>
`,


logs:
`
<svg viewBox="0 0 24 24" width="18" height="18">
<path d="M4 4h16v2H4Zm0 7h16v2H4Zm0 7h10v2H4Z"
fill="currentColor"/>
</svg>
`

};




// -----------------------------
// GET TOKEN
// -----------------------------

function getToken(){

    return localStorage.getItem("token");

}




// -----------------------------
// API CALL
// -----------------------------

async function fetchDashboard(){


    const token = getToken();


    if(!token){

        throw new Error("No token found");

    }



    const response =
    await fetch(
        API_URL,
        {
            method:"GET",

            headers:{
                "Authorization":
                `Bearer ${token}`,

                "Content-Type":
                "application/json"
            }
        }
    );



    const result =
    await response.json();



    console.log(
        "Dashboard API:",
        result
    );



    if(!response.ok){

        throw new Error(
            result.message ||
            "Dashboard loading failed"
        );

    }



    return result.data;


}






// -----------------------------
// USER
// -----------------------------

function renderUser(user){


    const avatar =
    document.getElementById(
        "avatarInitial"
    );


    if(avatar){

        avatar.textContent =
        user.initial ||
        user.name.charAt(0);

    }

}





// -----------------------------
// STAT CARDS
// -----------------------------


function renderStatCards(stats){


const container =
document.getElementById(
"statCards"
);



container.innerHTML =

`

<div class="stat-card">


<div class="stat-top">

<div class="stat-icon blue">

${ICONS.visitors}

</div>


<span class="stat-change">
+${stats.changePercent}%
</span>


</div>


<div class="stat-value">

${stats.totalVisitorsToday}

</div>


<div class="stat-label">
Total Visitors Today
</div>


</div>





<div class="stat-card">


<div class="stat-top">


<div class="stat-icon blue">

${ICONS.users}

</div>


</div>



<div class="stat-value">

${stats.checkedIn}

</div>


<div class="stat-label">

Checked In Now

</div>


</div>

`;



}








// -----------------------------
// QUICK ACCESS
// -----------------------------


function renderQuickAccess(){


const items=[

{
label:"Users",
sub:"Manage staff",
icon:"users",
href:"manage-users.html"
},

{
label:"Visitors",
sub:"All records",
icon:"visitors",
href:"all-visitors.html"
},


{
label:"Reports",
sub:"Analytics",
icon:"reports",
href:"reports-analytics.html"
},


{
label:"Notifications",
sub:"Alerts",
icon:"bell",
href:"#"
},


{
label:"Departments",
sub:"Settings",
icon:"departments",
href:"departments.html"
},


{
label:"Entry Logs",
sub:"Audit trail",
icon:"logs",
href:"#"
}

];




const grid =
document.getElementById(
"quickGrid"
);



grid.innerHTML =


items.map(item=>`


<a class="quick-item"
href="${item.href}">


<div class="quick-icon">

${ICONS[item.icon]}

</div>


<div class="quick-text">


<div class="label">
${item.label}
</div>


<div class="sub">
${item.sub}
</div>


</div>


</a>


`).join("");



}








// -----------------------------
// TAG CLASS
// -----------------------------


function tagClass(tag){

return tag
.toLowerCase()
.replace(/\s+/g,"-");

}








// -----------------------------
// RECENT ACTIVITY
// -----------------------------


function renderActivity(items){


const list =
document.getElementById(
"activityList"
);



if(items.length===0){


list.innerHTML=

`
<p style="text-align:center">
No visitors today
</p>
`;

return;


}




list.innerHTML =


items.map(item=>`


<div class="activity-item">


<div class="activity-avatar">

${item.initials}

</div>



<div class="activity-body">


<div class="activity-name">

${item.name}

</div>



<div class="activity-host">

${item.hostLine}

</div>



<div class="activity-tags">


${

item.tags.map(tag=>`

<span class="tag ${tagClass(tag)}">

${tag}

</span>

`).join("")

}



</div>


</div>




<div class="activity-time">

${item.time}

</div>



</div>


`).join("");



}









// -----------------------------
// SEARCH
// -----------------------------


function wireSearch(){


const input =
document.querySelector(
".search-wrap input"
);



if(!input)
return;



input.addEventListener(
"keydown",
(e)=>{


if(e.key==="Enter" &&
input.value.trim()
){


window.location.href =
`all-visitors.html?q=${encodeURIComponent(input.value)}`;


}


});



}








// -----------------------------
// LOAD DASHBOARD
// -----------------------------


async function loadDashboard(){


try{


const data =
await fetchDashboard();



renderUser(
data.user
);



renderStatCards(
data.stats
);



renderQuickAccess();



renderActivity(
data.recentActivity
);



wireSearch();



}

catch(error){


console.error(
"Dashboard error:",
error
);



document.querySelector(
".content"
).innerHTML =


`

<p style="
color:red;
text-align:center;
">

${error.message}

</p>

`;



}



}







document.addEventListener(
"DOMContentLoaded",
loadDashboard
);