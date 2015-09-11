// ==UserScript==
// @name         UCSD Webreg2GoogleCalendar
// @namespace    http://anoxdd.github.io
// @version      1.1.091115
// @description  A script to convert UCSD Webreg to a .csv file that can be imported to Google Calendar
// @author       Anoxic guanrunjie@gmail.com
// @include      https://act.ucsd.edu/webreg2/main*
// @grant        none
// ==/UserScript==

/**
 * The address code map of our campus, retrieved Sept 11, 2015
 * Change TBA and OFF (off-campus) to an empty string
 * @link https://libraries.ucsd.edu/_files/sshl/pdf/building-and-facility-codes.pdf
 */
var addressCodeMap = {
	APM: "Applied Physics & Mathematics Building",
	ASANT: "Asante Hall",
	BIO: "Biology Building",
	BIRCH: "Birch Aquarium",
	BONN: "Bonner Hall",
	BSB: "Biomedical Sciences Building",
	CCC: "Cross-Cultural Center",
	CENTR: "Center Hall",
	CICC: "Copely International Conference Center",
	CILAS: "Center for Iberian and Latin American Studies",
	CLICS: "Center for Library & Instructional Computing Services",
	CLIN: "Clinical Sciences Building / Clinical Research Facility",
	CMG: "Center for Molecular Genetics",
	CMME: "Center for Molecular Medicine East",
	CMMW: "Center for Molecular Medicine West",
	CMRR: "Center for Magnetic Recording Research",
	CPMC: "Conrad Prebys Music Center",
	CRB: "Chemistry Research Building",
	CSB: "Cognitive Science Building",
	DANCE: "Wagner Dance Building",
	DSD: "Deep Sea Drilling Building",
	EBU1: "Engineering Building Unit 1",
	EBU2: "Engineering Building Unit 2",
	EBU3B: "Engineering Building Unit 3",
	ECKRT: "SIO Library, Eckart Building",
	ECON: "Economics Building",
	ERCA: "Eleanor Roosevelt College Administration",
	FORUM: "Mandell Weiss Forum",
	GEISL: "Geisel Library",
	GH: "Galbraith Hall",
	HSS: "Humanities & Social Sciences Building",
	HUBBS: "Hubbs Hall",
	IGPP: "Institute of Geophysics & Planetary Physics",
	IOA: "Institute of the Americas",
	LASB: "Latin American Studies Building",
	"LEDDN AUD": "Patrick J. Ledden Auditorium",
	LFFB: "Leichtag Family Foundation Biomedical Research Building",
	LIT: "Literature Building",
	MANDE: "Mandeville Center",
	MAYER: "Mayer Hall",
	MCC: "Media Center/Communication Building",
	MCGIL: "McGill Hall",
	MNDLR: "Mandler Hall",
	MTF: "Medical Teaching Facility",
	MWEIS: "Mandell Weiss Theatre",
	"MYR-A": "Mayer Hall Addition",
	NIERN: "Nierenberg Hall",
	NSB: "Faustina Solis Lecture Hall",
	NTV: "Nierenberg Hall Annex",
	OAR: "Keck Center for Ocean & Atmospheric Research",
	OFF: "",
	OTRSN: "Otterson Hall",
	PACIF: "Pacific Hall",
	PCYNH: "Pepper Canyon Hall",
	PETER: "Peterson Hall",
	PFBH: "Powell-Focht Bioengineering Hall",
	POTKR: "Potiker Theatre",
	PRICE: "Price Center",
	RBC: "Robinson Building Complex",
	RECGM: "Recreation Gymnasium",
	RITTR: "Ritter Hall",
	RVCOM: "Revelle Commons",
	RVPRO: "Revelle College Administration Building",
	SCHOL: "Scholander Hall",
	SCRB: "Stein Clinical Research Building",
	SCRPS: "Old Scripps Building",
	SDSC: "San Diego Supercomputer Center",
	SEQUO: "Sequoyah Hall",
	SERF: "Science & Engineering Research Facility",
	SOLIS: "Solis Lecture Hall",
	SSB: "Social Sciences Building",
	SSRB: "Social Sciences Research Building",
	SVERD: "Sverdrup Hall",
	TBA: "",
	"TM101-103": "Thurgood Marshall College Trailers",
	TMCA: "Thurgood Marshall College Administration Building",
	U201: "University Center, Building 201",
	U303: "University Center, Building 303, Cancer Research Facility",
	U409: "University Center, Building 409",
	U413: "University Center, Building 413",
	U413A: "University Center, Building 413A",
	U515: "University Center, Building 515",
	U516: "University Center, Building 516",
	U517: "University Center, Building 517",
	U518: "University Center, Building 518",
	UNEX: "University Extension Complex",
	UREY: "Urey Hall",
	"URY-A": "Urey Hall Addition",
	VAF: "Visual Arts Facility",
	VAUGN: "Vaughan Hall",
	WLH: "Warren Lecture Hall",
	YORK: "York Hall, Undergraduate Sciences Building"
};


function downloadWebregData() {
	var data = collectRawDataFromWebsite(),
		data = processRawDataCollected(data);
	csv = convertDataCollectedToCSV(data);
	downloadCSVData(csv);
}

/**
 * Collects the data from the website, then return an object including all the data needed 
 * @returns {object} - A dict that includes the data
 */
function collectRawDataFromWebsite() {
	// Collect the data
	var data = {},
		course;
	$("#list-id-table tr[role=row]").each(function() {
		var $td = $(this).children("td");
		// Test if there is a new course
		if ($td.eq(0).text().replace(/ /g, "").length) {
			// There is a new course
			course = $td.eq(0).text();
			// Remove ununcessary spaces
			while (course.indexOf("  ") !== -1) {
				course = course.replace(/  /g, " ");
			}
			while (course[0] === " ") {
				course = course.substr(1);
			}
			while (course[course.length - 1] === " ") {
				course = course.substr(0, course.length - 1);
			}
		}
		// Find the type
		var type = $td.filter("[aria-describedby=list-id-table_FK_CDI_INSTR_TYPE]").text();
		if (!type.replace(/ /g, "").length) {
			// This type is invalid
			return;
		}
		// Find the days, time, building and room
		var days = $td.filter("[aria-describedby=list-id-table_DAY_CODE]").text(),
			time = $td.filter("[aria-describedby=list-id-table_coltime]").text(),
			bldg = $td.filter("[aria-describedby=list-id-table_BLDG_CODE]").children("a").text(),
			room = $td.filter("[aria-describedby=list-id-table_ROOM_CODE]").children("a").text();
		// Push all the data just found
		data[course] = data[course] || [];
		data[course].push({
			type: type,
			days: days,
			time: time,
			bldg: bldg,
			room: room
		});
	});
	return data;
}

/**
 * Processes the raw data collected directly from the web
 * @param {object} data - The data to be processed
 * @returns {object} data - A data that is more suitable for parsing to .csv string, an empty object if something goes wrong
 */
function processRawDataCollected(data) {
	// Process the data itself, also calculate the first day of class (the Monday of the first week)
	var courses = Object.keys(data),
		firstDay,
		typeMap = {
			LE: "Lecture",
			DI: "Discussion",
			////LA: "Lab", // Not supported yet
			FI: "FINAL"
		};
	for (var i = 0; i !== courses.length; ++i) {
		var course = courses[i],
			timetables = data[course];
		for (var j = 0; j !== timetables.length; ++j) {
			var timetable = timetables[j];
			// Fix type
			var type = timetable.type;
			if (typeMap[type]) {
				timetable.type = typeMap[type];
			} else {
				timetables.splice(j--, 1);
				continue;
			}
			// Find the first day of class or process the days
			if (type === "FI") {
				// This is a final day, correct it `timetable.days` follows "[WEEKDAY] MM-DD-YYYY"
				timetable.days = timetable.days.split(" ")[1];
				// Find the first day of the class
				if (!firstDay) {
					// The first day is yet to be known
					var dateElements = timetable.days.split("/"),
						day = parseInt(dateElements[1]);
					if (dateElements.length !== 3) {
						// Something's wrong when converting the data, return nothing
						alert("Cannot find the first day of the class");
						return {};
					}
					// Keep finding the first day of the class
					var date = new Date(parseInt(dateElements[2]), parseInt(dateElements[1]), day);
					if (isNaN(date.getTime())) {
						alert("Cannot convert to the first day of the class");
						return {};
					}
					// Find the Monday of finals week
					day -= (date.getDay() % 7 - 1);
					// Find the first Monday of the quarter, roll back ten weeks
					day -= 70;
					firstDay = new Date(parseInt(dateElements[2]), parseInt(dateElements[1]), day).getTime();
				}
			} else {
				// A lecture, discussion or lab, separate those weekdays into a group of days
				timetable.days = timetable.days.replace(/([A-Z])/g, " $1").substr(1).split(" ");
			}
			// Process the time, convert them to 24-hour format
			var times = timetable.time.split("-");
			for (var k = 0; k !== times.length; ++k) {
				var time = times[k],
					isAm = (time[time.length - 1] === "a");
				time = time.substr(0, time.length - 1);
				if (!isAm) {
					// Add 12 hours to the time
					var timeSplit = time.split(":");
					timeSplit[0] = parseInt(timeSplit[0]) + 12;
					time = timeSplit.join(":");
				}
				times[k] = time;
			}
			timetable.startTime = times[0];
			timetable.endTime = times[1];
			// Find the location
			if (addressCodeMap[timetable.bldg]) {
				timetable.location = addressCodeMap[timetable.bldg] + ", UCSD";
			} else {
				timetable.location = "";
			}
			// The subject of the calendar
			timetable.subject = "[" + course + "] " + timetable.type + (timetable.room ? " (Room " + timetable.room + ")" : "");
		}
	}
	data.firstDay = firstDay;
	return data;
}

/**
 * Processes the data collected to .csv file
 * @param {object} data - The processed data to be converted
 * @returns {string} - A string that will be included in the csv file, an empty string if something goes wrong
 */
function convertDataCollectedToCSV(data) {
	// The header of the csv
	var csv = "Subject,Start Date,Start Time,End Date,End Time,Location\n",
		courses = Object.keys(data);
	if (courses.length) {
		var weekdayMap = {
			M: 0,
			Tu: 1,
			W: 2,
			Th: 3,
			F: 4,
			S: 5
		};
		for (var i = 0; i !== courses.length; ++i) {
			// Test if this course is `firstDay`
			if (courses[i] !== "firstDay") {
				var timetables = data[courses[i]],
					firstDay = data.firstDay;
				for (var j = 0; j !== timetables.length; ++j) {
					var timetable = timetables[j];
					// Create the list of the days
					if (timetable.type === "FINAL") {
						// Only one day of final
						csv += ['"' + timetable.subject + '"', timetable.days, timetable.startTime, timetable.days, timetable.endTime, '"' + timetable.location + '"'].join(",") + "\n";
					} else {
						/*Iterator*/
						var k;
						var days = timetable.days,
							newDays = [];
						// Get the days
						for (k = 0; k !== days.length; ++k) {
							var weekday = weekdayMap[days[k]];
							if (weekday != undefined) {
								newDays.push(weekday);
							} else {
								// Something goes wrong
								alert("Cannot read unknown weekday: " + weekday);
								return "";
							}
						}
						// Get the list of all the days from `firstDay`
						// There are ten weeks
						var firstMonday = firstDay,
							allDayStr = [];
						for (k = 0; k !== 10; ++k) {
							for (var l = 0; l !== newDays.length; ++l) {
								// Go to that day
								var today = new Date(firstMonday + newDays[l] * 86400000);
								// Get the specific date
								allDayStr.push((today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear());
							}
							// Go to the next week
							firstMonday += 7 * 86400000;
						}
						// Add these dates to the csv
						for (k = 0; k !== allDayStr.length; ++k) {
							csv += ['"' + timetable.subject + '"', allDayStr[k], timetable.startTime, allDayStr[k], timetable.endTime, '"' + timetable.location + '"'].join(",") + "\n";
						}
					}
				}
			}
		}
		return csv;
	} else {
		// Something goes wrong while converting
		return "";
	}
}

/**
 * Downloaded the csv data given the csv string
 * Original code from stackoverflow
 * @param {string} csvStr - The csv string to be included in the file
 * @link http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
 */
function downloadCSVData(csvStr) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvStr));
	element.setAttribute('download', "WebRegCalendar.csv");
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

// This script assumes that jQuery is preloaded
$(document).ready(function() {
	var $download = $("<a id='download-google-calendar' href='javascript:;'>Download Google Calendar</a>");
	$download.click(downloadWebregData).prependTo($("#view-booklist").prepend(" | "));
});