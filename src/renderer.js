'use strict'

const puppeteer = require('puppeteer')
const rimraf = require('rimraf');
const {PerformanceObserver,performance} =require('perf_hooks');
let start_time=performance.now();

class Renderer {
  constructor(browser) {
    this.browser = browser
    this.lock=false;
    this.counter=0;
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

    const page = await this.browser.newPage()
    await page.goto(url, gotoOptions)
	
    if(Number(width)>0 && Number(height)>0){
     await page.setViewport({width: Number(width), height: Number(height)});
    }
    if(Number(delay)>0){
      const Loaded=await this.isLoaded(page,delay);
    }
    return page
  }

  async render(url, options) {
    let page = null
    try {
      const { timeout, waitUntil } = options
      page = await this.createPage(url, { timeout, waitUntil })
      if(page==null){
        return null;
      }
      const html = await page.content()
      return html
    } finally {
        if (page) {
        	await page.evaluate(() => {
        		   localStorage.clear();
        		 });
        	console.log("Local Storage cleaned!");
            await page.goto('about:blank')
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
            await page.goto('about:blank')
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
        await page.goto('about:blank')
        await page.close()
        page=null;
        console.log("Page closed!");
      }
    }
  }
  async restart(){
    await this.close();
    this.browser=await puppeteer.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--enable-heap-profiling','--enable-precise-memory-info']})
  }

  async close() {   
    if(this.browser!=null){
      await this.browser.close()
      this.browser=null;
    }
  }
}

async function create() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-dev-shm-usage']})
  return new Renderer(browser)
}

module.exports = create
