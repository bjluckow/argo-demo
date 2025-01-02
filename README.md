# A Candid Demo of ARGO: A Milestone in My Full-Stack Development Journey

> Built [with love](https://www.youtube.com/watch?v=opkzgLMH5MA) at Cornell
> University between February and May 2024

## Table of Contents

1. [Introduction](#introduction)
1. [Context and Motivations](#context-and-motivations)
1. [Design](#design-and-implementation)
1. [Retrospective](#retrospective)

## Introduction

This (mostly-functional) project was **entirely self-motivated** to learn,
practice, and deepen my understanding of the following:

- **Node.js**
- **TypeScript**
- **SQLite** using **DrizzleORM** for programmatic local data storage
- **React** and **TailwindCSS**, both of which I learned through this project
  and later used to build [benjaminluckow.com](www.benjaminluckow.com)
- Palantir's **Blueprint.js** UI library, which helped me turn messy ideas into
  organized, reactive interfaces and forms
- **NextJS**, which did lots of heavy lifting in terms of structuring the
  project, and served as an amazing jumping-off point into web dev.
- Various **Python** libraries, namely **numpy**, **pandas**, **tensorflow**,
  and **seaborn** to create some basic machine learning models using the
  collected data. Since I submitted the notebooks as part of a class assignment,
  I can't release the code publicly. You'll have to take me at my word that I
  trained a logistic regression model on
  [USE vectors](https://tfhub.dev/google/universal-sentence-encoder) , but I
  assure you the results were mediocre.

With the exception of porting the code over to an updated NextJS environment,
removing any sensitive accidentally-committed data, and some minor cleanups,
I've left most of the code intact as an authentic snapshot of some super
instructive and rewarding nights from various sleepness nights in Duffield Hall
Atrium during my senior spring.

The result wasn't perfect, but the experience of building it—and all the little
victories and failures along the way—taught me more about modern software
engineering than I ever could've expected.

## Context and Motivations

I conceived ARGO (named after the
[mythical ship](https://en.wikipedia.org/wiki/Argo)) during my senior year at
Cornell as a codeless universal news scraper inspired my work during the
previous few summers.

My sophomore summer, I worked closely with multiple political campaigns doing
everything from writing PowerPoint presentations to managing voter databases,
but I found a niche in automating PR using Python and SQLite, inspiring me to
pivot majors from Operations Research Engineering to Computer Science to help
bring my ideas to life.

My junior summer, I gained experience as a software engineering intern, learning
TypeScript in a full-stack environment and beginning to explore the Node.js
ecosystem. My senior year workload was very intense (in order to finish the CS
major on time!), so designing a highly-customizable crawling engine to improve
on my past news scraping ideas—with a functional frontend to manage the crawls
and scraped data—became my way to blow off steam.

After teaching myself some React and NextJS basics over the winter, I spent my
final semester working on this passion project as a sort of trial-by-fire. I
added some motivation by tying it to my final project grade in ORIE4741, opting
to use any collected data to train some basic machine learning models using text
vectorization and other NLP techniques. This actually worked out but I would
_not_ recommend doing this during your final semester of college.

I did this all in hopes that I could eventually use a version of this project to
help small political campaigns collect big data. In the spirit of 2024, I later
automated most of the usefulness of this app away with the OpenAI API in a
different project, but this was an awesome start.

## Design and Implementation

The goal of this project was to enable fast and simple (enough) scraper
customization using JSON configurations tailored to each potential news source
to allow for large-scale data collection from a catalog of sites—at least as
large-scale as my laptop could handle.

For any website, the user could create a "Domain," which represented a
configuration used to extract data, as well as any metadata that could be used
in querying (e.g., geographic location, category, user notes, etc.). After
identifying a pattern in a site's article URLs, the user could create "routines"
containing JSON instructions that mapped to headless browser functionality
(e.g., click a selector or extract an element's data). When a matching link was
visited by a crawler, this routine was used to interact with and extract data
from the underlying browser webpage. Crawling rules, such as a delay between
visits, could be set on a per-site or per-crawl basis.

Sites, links, scrapes, crawls, and errors were all stored to a local SQLite
database. Site configurations were stored separately in a JSON file and linked
to SQLite rows by IDs. Links were indexed and cached so as to avoid duplicate
page visits, while serialized errors were used to temporarily disable sites for
crawling in the event of apparent blocking. Most of the final functionality
revolved around managing sites and executing crawls, as I would export collected
data to Python projects directly, although I left room for eventual analysis
features.

## Retrospective

The code could have at least been worse: it was decently organized,
not-overly-convoluted, but definitely **not built with deployment in mind**:

- This "dashboard" was only meant to be run in a **local dev environment** to
  give me a visual UI for configuring scraping routines, tracking errors, and
  running crawls across various sites. I actually have no idea whether or not
  this would deploy properly to Vercel.
- The SQLite database and associated DrizzleORM code is only designed for local
  use. This choice taught me a painful but important lesson about asynchronous
  transactions, which is memorialized in the code as two different database
  wrappers.
- Several versions of Puppeteer were installed as I messed around with headless
  browser automation. This was also an interesting choice as almost none of the
  news sources I ultimately scraped needed JavaScript rendering, but at least
  the system's flexible.
- An entire "Scan Service" section of code existed solely for organization and
  had nothing to do with being deployed indepedently as a service. However, this
  proved useful and helped me avoid accidentally loading Puppeteer (and thereby
  an entire Chrome installation) when using engine types in the frontend.
- I'm very good at thinking ahead when it comes to potential future features. I
  can't imagine I implemented any of those. I was already working on more
  general browser automation projects after graduation.
- No polish was applied; I think the last major efforts were done in the leadup
  to the aforementioned project deadline. The takeaway here was that CLI apps
  are easier to develop.

Despite its flaws, this project did actually collect enough data to push my
SQLite database to its limits and get me a decent grade on that NLP model. And
thanks to the React, Tailwind, and NextJS experience, I was also able to start
rapidly building websites like [this one](www.benjaminluckow.com). The lessons
learned and the experience with the tools were invaluable as I headed towards
graduation, and this exercise was an amazing jumping-off point into thinking
about end-to-end full stack development and how to architect complex systems.
This project will always have a special place in my heart along with all my
friends with whom I graduated.
