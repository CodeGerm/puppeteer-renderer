'use strict'

const puppeteer = require('puppeteer')
const rimraf = require('rimraf');
const {PerformanceObserver,performance} =require('perf_hooks');
let start_time=performance.now();

class Renderer {
  constructor(browser) {
    this.browser = browser
  }

  async isLoaded(page, delay){
    let finishLoaded=null;
    try{
      finishLoaded = await page.$eval('#dashboardLoadedDone', el => el.value);
    }catch(e){
      try{
        finishLoaded = await page.$eval('#exploreLoadedDone', el => el.value);
      }catch(e){
        await page.waitFor(Number(delay))
        return;
      }
    }
    let start=performance.now();
    let end=null;
    while(new String(finishLoaded).valueOf() =="no"){
      try{
        finishLoaded = await page.$eval('#dashboardLoadedDone', el => el.value);
      }catch(e){
        finishLoaded = await page.$eval('#exploreLoadedDone', el => el.value);
      }
      end = performance.now();
      if((end-start)>Number(delay)){
        console.log("not finish loading")
        break;
      }
    }
    await page.waitFor(1500)
    return finishLoaded;
  }

  async createPage(url, { timeout, waitUntil, height, width, delay }) {
    if(this.browser==null){
      return null;
    }
    let gotoOptions = {
      timeout: Number(timeout) || 20 * 1000,
      waitUntil: waitUntil || 'networkidle2',
    }
    let page=null;
    try{
      page = await this.browser.newPage()
      if(page.isClosed())
        return null;
      await page.goto(url, gotoOptions)
      if(Number(width)>0 && Number(height)>0){
        await page.setViewport({width: Number(width), height: Number(height)});
      }
      if(Number(delay)>0){
        if(!page.isClosed()){
          const Loaded=await this.isLoaded(page,delay);
        }
      }
    }catch(e){
      console.log(e);
    }finally{
      return page
    }
  }

  async render(url, options) {
    let page = null
    try {
      const { timeout, waitUntil } = options
      page = await this.createPage(url, { timeout, waitUntil })
      if(page==null){
        return null;
      }
      // let heapUsed = process.memoryUsage().heapUsed;
      // //page.title().then(value=>console.log("before open page "+value+" Program is using " + heapUsed + " bytes of Heap."))
      // console.log("before open page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
      const html = await page.content()
      return html
    } finally {
        if (page) {
        	await page.evaluate(() => {
        		   localStorage.clear();
        		 });
        	console.log("Local Storage cleaned!");
          // let heapUsed = process.memoryUsage().heapUsed;
          // //page.title().then(value=>console.log("before open page "+value+" Program is using " + heapUsed + " bytes of Heap."))
          // console.log("before open page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
            //await page.goto('about:blank')
            await page.close()
            page=null;
            console.log("Page closed!");
          }   
    }
  }

  async pdf(url, options) {
    let page = null
    try {
      const { timeout, waitUntil,height, width, delay, ...extraOptions } = options
      page = await this.createPage(url, { timeout, waitUntil, height, width, delay })
      if(page==null){
        return null;
      }
      const { scale, displayHeaderFooter, printBackground, landscape } = extraOptions
      const buffer = await page.pdf({
        ...extraOptions,
        scale: Number(scale),
        displayHeaderFooter: displayHeaderFooter === 'true',
        printBackground: printBackground === 'true',
        landscape: landscape === 'true',
      })
      return buffer
    } finally {
        if (page) {
        	await page.evaluate(() => {
        		   localStorage.clear();
        		  
        		 });
        	console.log("Local Storage cleaned!");
            //await page.goto('about:blank')
            await page.close()
            page=null;
            console.log("Page closed!");
          }
    }
  }

  async screenshot(url, options) {
    let page = null
    try {
      const { timeout, waitUntil,height, width, delay, ...extraOptions } = options
      page = await this.createPage(url, { timeout, waitUntil, height, width, delay })
      if(page==null){
        return null;
      }
      // let heapUsed = process.memoryUsage().heapUsed;
      // //page.title().then(value=>console.log("before open page "+value+" Program is using " + heapUsed + " bytes of Heap."))
      // console.log("before open page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
      const { fullPage, omitBackground } = extraOptions
      const buffer = await page.screenshot({
        ...extraOptions,
        fullPage: true,
        omitBackground: omitBackground === 'true',
      })
      return buffer
    } finally {
      if (page) {
    	await page.evaluate(() => {
    		   localStorage.clear();
    		 });
    	console.log("Local Storage cleaned!");
        // let heapUsed = process.memoryUsage().heapUsed;
        // //page.title().then(value=>console.log("after open page "+value+" Program is using " + heapUsed + " bytes of Heap."))
        // console.log("after open page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
        //await page.goto('about:blank')
        await page.close()
        page=null;
        console.log("Page closed!");
      }
    }
  }
  async restart(){
    await this.close();
    this.browser=await puppeteer.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--media-cache-size=1','--disk-cache-size=1','--disable-application-cache','--disable-session-storage','--js-flags="--max-old-space-size=200"']})
  }

  async close() {   
    if(this.browser!=null){
      let pages=await this.browser.pages();
      try{
        await Promise.all(pages.map(async page=>{
          try{
            // let heapUsed = process.memoryUsage().heapUsed;
            // console.log("before close browser before close page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
            await page.evaluate(() => {
              localStorage.clear();              
            });
            console.log(" Local Storage cleaned!");
          } catch(e){
            console.log(e);
          }finally{           
            // let heapUsed = process.memoryUsage().heapUsed;
            // //heapUsed = process.memoryUsage().heapUsed;
            // console.log("before close browser after close page "+page.mainFrame()._id+" Program is using " + heapUsed + " bytes of Heap.")
            if(!page.isClosed()){
              await page.close()
            }
            page=null;
            console.log(" browsers Page closed!");
          }
        }))
      }catch(e){
        console.log(e);
      }finally{
        await this.browser.close()
        this.browser=null;  
      }    
    }
  }
}


async function create() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--media-cache-size=1','--disk-cache-size=1','--disable-application-cache','--disable-session-storage','--js-flags="--max-old-space-size=200"']})
  return new Renderer(browser)
}

module.exports = create
