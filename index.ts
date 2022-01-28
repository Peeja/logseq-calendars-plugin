import '@logseq/libs';
import { PageEntity } from '@logseq/libs/dist/LSPlugin.user';
const ical = require('node-ical');
const axios = require('axios');

let calendarName = "Gcal"
async function rawParser(rawData) {
  logseq.App.showMsg("Parsing Calendar Items")
	var eventsArray = []
  var rawDataV2 = ical.parseICS(rawData)
  // console.log("rawData")
  console.log(rawData)
  
	for (const dataValue in rawDataV2) {
		eventsArray.push(rawDataV2[dataValue]); //simplifying results, credits to https://github.com/muness/obsidian-ics for this implementations
	}
	return eventsArray;
}

function templateFormatter(template, description = "No Description", date = "No Date", start = "No Start", end = "No End", title = "No Title"){
  let properDescription
  if (description == ""){
    properDescription = "No Description"
  }
  else{
    properDescription = description
  }
  let subsitutions = {"{Description}": properDescription, "{Date}" :date, "{Start}": start, "{End}": end, "{Title}":title}
var templatex1 = template

for (const substitute in subsitutions){
  let template2 = templatex1.replace(substitute, subsitutions[substitute])
  let template3 = template2.replace(substitute.toLowerCase(), subsitutions[substitute])
  templatex1 = template3
}
return templatex1
}

function formatTime(rawTimeStamp){
  let formattedTimeStamp = new Date(rawTimeStamp)
  let initialHours = formattedTimeStamp.getHours()
  let hours;
  if (initialHours == 0){
    hours = "00"
  }
  else {
    hours = initialHours
  }
  let formattedTime
  if (formattedTimeStamp.getMinutes() <10){
    formattedTime = hours + ":" + "0"+(formattedTimeStamp.getMinutes())
  }
  else{formattedTime = hours + ":" + (formattedTimeStamp.getMinutes())
}
  return formattedTime
}

const getDateForPage = (d: Date, preferredDateFormat: string) => {
  const getYear = d.getFullYear();
  const getMonth = d.toString().substring(4, 7);
  const getMonthNumber = d.getMonth() + 1;
  const getDate = d.getDate();

  if (preferredDateFormat === 'MMM do yyyy') {
    return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
  } else if (
    preferredDateFormat.includes('yyyy') &&
    preferredDateFormat.includes('MM') &&
    preferredDateFormat.includes('dd') &&
    ('-' || '_' || '/')
  ) {
    var mapObj = {
      yyyy: getYear,
      dd: ('0' + getDate).slice(-2),
      MM: ('0' + getMonthNumber).slice(-2),
    };
    let dateStr = preferredDateFormat;
    dateStr = dateStr.replace(/yyyy|dd|MM/gi, function (matched) {
      return mapObj[matched];
    });
    return `${dateStr}`;
  } else {
    return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
  }
};

const getOrdinalNum = (n: number) => {
  return (
    n +
    (n > 0
      ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
      : '')
  );
};

async function insertJournalBlocks(data, preferredDateFormat:string, calendarName, settings){
  let pageID: PageEntity = await logseq.Editor.createPage(getDateForPage(new Date(), preferredDateFormat))
  // logseq.App.pushState('page', { name: pageID.name })
  let pageBlocks = await logseq.Editor.getPageBlocksTree(pageID.name)
  let footerBlock = pageBlocks[pageBlocks.length -1]
  let startBlock = await logseq.Editor.insertBlock(footerBlock.uuid, calendarName, {sibling:true})
  console.log(data)
  for (const dataKey in data){
    // let date = Math.floor(new Date(data[dataKey]["start"]).getTime() / 1000)
    let description = data[dataKey]["description"]
    let startDate = data[dataKey]["start"]
    let startTime = formatTime(startDate)
    let endTime = formatTime(data[dataKey]["end"])
    let summary = data[dataKey]["summary"]
      let headerString = templateFormatter(settings.template, description, startDate, startTime, endTime, summary)
      if (getDateForPage(new Date(startDate), preferredDateFormat) == getDateForPage(new Date(), preferredDateFormat)){
    var currentBlock = await logseq.Editor.insertBlock(startBlock.uuid, `${headerString}`, {sibling:false})
    if (settings.templateLine2 != ""){
      console.log(description)
    let SecondTemplateLine = templateFormatter(settings.templateLine2, description, startDate, startTime, endTime, summary)
    console.log(currentBlock)
    logseq.Editor.insertBlock(currentBlock.uuid, `${SecondTemplateLine}`, {sibling:false})}}
  }
}

// async function insertBlocks(data){
//   logseq.App.showMsg("Inserting Google Calendar items!")
//   logseq.Editor.deletePage("Google Calendar Import")
//   try {
//     var pageID = await logseq.Editor.getPage("Google Calendar Import")
//     if (pageID == null){
//       logseq.Editor.createPage("Google Calendar Import")
//   }
  
//   pageID = await logseq.Editor.getPage("Google Calendar Import")
//   // logseq.App.pushState('page', { name: pageID.name })
//   for (const dataKey in data){
//     let date = Math.floor(new Date(data[dataKey]["start"]).getTime() / 1000)
//     let convertedStartDate = timeConverter(date)
//     let currentBlock = await logseq.Editor.insertBlock(pageID.name, `${data[dataKey]["summary"]}\nSCHEDULED: <${convertedStartDate} MON>`, {isPageBlock: true})
//     if (data[dataKey]["description"] != ""){    
//       await logseq.Editor.insertBlock(currentBlock.uuid, `${data[dataKey]["description"]}`, {sibling: false})
//     }
    
//   }
// // }
//   catch(err){
//     console.log(err)
//     logseq.App.showMsg(`There was an error`)
    
//   }
  
// }
async function openCalendar2 (preferredDateFormat, calendarName, url, settings) {
  try{
  logseq.App.showMsg("Fetching Calendar Items")
  let response2 = await axios.get(url)
  var hello = await rawParser(response2.data)
  // insertBlocks(hello)
  insertJournalBlocks(hello, preferredDateFormat, calendarName, settings)
}
  catch(err){
    console.log(`There was an error: ${err}`)
  }
}
async function main () {
  const userConfigs = await logseq.App.getUserConfigs();
  const preferredDateFormat2 = userConfigs.preferredDateFormat;
  // logseq.updateSettings({disabled: false, template: "{Start} - {End}: {Title}", templateLine2: "{Description}", accounts: {"Account 1": ["", "f 1"], "ManageBac": ["", "f 2"]}})
  logseq.provideModel({
   async openCalendar2(){
     let fullSettings = await logseq.settings
     let settings = await fullSettings["accounts"]
     for (const accountName in settings){
    openCalendar2(preferredDateFormat2, accountName, settings[accountName][0], fullSettings), fullSettings}
   }
   }
)
for (const accountName in logseq.settings.accounts){
  console.log(await logseq.settings.accounts)
  let fullSettings = await logseq.settings
  let accountSetting  = fullSettings.accounts[accountName]
    logseq.App.registerCommandPalette(
      {
        key: `logseq-${accountName}-sync`,
        label: `Syncing with ${accountName}`,
        keybinding: {
          binding: accountSetting[1],
        },
      },
      () => {
          openCalendar2(preferredDateFormat2, accountName, accountSetting[0], fullSettings);
      }
    );
    }

  logseq.App.registerUIItem('toolbar', {
    key: 'open-calendar2',
    template: `
      <a class="button" data-on-click="openCalendar2">
        <i class="ti ti-calendar-event"></i>
      </a>
    `,
  })
   
  }
logseq.ready(main).catch(console.error);





