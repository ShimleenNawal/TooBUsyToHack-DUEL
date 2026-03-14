# TooBUsyToHack - DUEL
<img width="523" height="120" alt="image" src="https://github.com/user-attachments/assets/f6e1d8cd-151d-43b6-96cf-34ff8ab09450" />

## Overview

DUEL is the productivity enhancing website that aims to foster a sense of proactivity and productivity through the means of competition. There are two types of users that being users and admins. Admins can provide tasks with deadlines and descriptions, aimed at users from specific departments and years of study. The task when published pits two random users (within the same department and year) up against eachother in a race to finish the assignment first. Admins can award users with medals, giving them a chance to appear on the leaderboards.

## Key Features:

-Submission time based assignment manager (creation and submission)

-1v1 Rival system skill and department based matchmaking

-Medal based award system

-Retro graphics (because thats cool)

## Mission statement

There are so many productivity trackers on the market that design whats effectively a calendar app or a tracker, trusting the user to be proactive and productive. DUEL believes iron sharpens iron and takes an aggressive approach to productivity and proactivity, pitting two people of simillar skill up against eachother to finish the same task, with the purpose of seeing who can finish it faster. Ofcourse, we also value quality, which is why medals are assigned by the admin manually. We at DUEL believe that productivity begins when users stop fighting deadlines and start competing with eachother. DUEL can have applications in corporate, local and university and we hope to one day integrate it into HKBU Moodle which is our university's all in one assignment management system.

## My Contribution

This project was built during a hackathon as a team collaboration.

My role focused on the **frontend interface and project presentation**, including:

* Implementing **HTML structure for the admin interface**
* Supporting layout and page organization
* Demonstrating the project during the **presentation video**

Original team repository: https://github.com/M3AT-H00K/TooBUsyToHack-DUEL

## Tech stack

-HTML,Css (basic outlines and structuring)

-Express js and js for Backend maagement and operations

-MongoDB and MongoDB compass for backend database

## Setup and run instructions (step‑by‑step)

Before talking about how to set up and run the work, there are utilities you need to know of. You can create as many users as you require by simply typing in an ID and password but those users will not be able to access the Admin side of the code as the Admin role is manually input in the backend. You will be provided with 4 Admins and 10 users. An admin can only create one task at a time until the task deadline expires and one admin has an ongoing taask until the 9th of march 11:59pm. Use the users accordingly. (NOTE: All user and admin passwords are "password")

### Users:

23223413, 23234123, 22223679, 23335129, 22229876, 23136565, 22225555, 22226666, 12312312, 10100101, 56565656

### Admins:

11111111, 11111112, 11111113, 11111114

### Running the code:

To Run the Code, clone the repository to a local file explorer and then using command prompt cd into the project folder

then in command prompt for the project folder:

npm install

npm start

this will activate all the code

after this you can visit http://localhost:3000/ this will take you to the login page.

### In the site

Note:Loading some data will take time or a refresh.

<img width="684" height="640" alt="image" src="https://github.com/user-attachments/assets/688e5c6f-cd8d-425d-b2d2-8f010fd36e06" />

If you input a brand new user id and password or an existing user id then you will be taken to the user homepage.

<img width="683" height="599" alt="image" src="https://github.com/user-attachments/assets/0466bb73-7c7f-4ace-9ec5-efb6e37fa19e" />

here you may access the settings to update your user info. (recommended first step)

<img width="684" height="642" alt="image" src="https://github.com/user-attachments/assets/fc7c0b39-0f72-4932-968f-167c7911820b" />

you can also access the tasks button which will show you if any user has any ongoing tasks, how much time remains and what the task is. You may also submit your task here (zip file).

<img width="659" height="613" alt="image" src="https://github.com/user-attachments/assets/846e17c3-3041-4292-87ef-245881c18c42" />

You can also check in with you rival through the rivals tab and make sure youre ahead of your rival. (haha, noob)

<img width="673" height="619" alt="image" src="https://github.com/user-attachments/assets/c3278d50-bf14-41a5-9f1e-0a07cd771ccc" />

if you logged in as an admin, you will be treated to a different webpage entirely. The admin homepage.

<img width="684" height="627" alt="image" src="https://github.com/user-attachments/assets/bb98e374-41b2-4e12-b0cd-2ca7dcebdd24" />

here you can create a task (if you havent already created one)(please input all fields)

<img width="631" height="620" alt="image" src="https://github.com/user-attachments/assets/4dd20376-db70-4d7d-8391-13bee3699bd2" />

Or you can check your inbox for existing submissions (submitted file and time left when submitted) (you can also award students medals)

<img width="691" height="615" alt="image" src="https://github.com/user-attachments/assets/bf061174-0b2a-4d57-aa3f-31b0a468cd37" />

(NOTE: there is no json tokenization involved because we only wanted to get the project to a state where it is functional, you may type route endpoints into the browser to take you to them directly at any point (SHHHHUSH.. secret)

IF YOU HAPPEN TO WANT MORE ADMINS (NOT INTENDED FOR PURPOSES OF THE PROJECT) you may utilise the mongodb connection string in the utils-> db.js file and manually turn a user into an admin in the backend using mongodb compass.

## Team members (All students are from Hong Kong Baptist University)

23223413 Jash Premkumar SHARMA

23201460 Shimleen Nawal

24262358 LI Jiayi

24204072 Mohamed Salihu Adnan Fazi

24225231 Vishal Kandel

## Source code organized in folders (e.g. src/, backend/, frontend/).

Public - javascripts, css files and one HTML file (login page)

Views - all other pages

Utils - db.js database connection

app.js - database connection

Routes - index.js for routing of whole project

Uploads - files exchanged in app

NOTE: Generative AI has been used throughout the project as it was permitted by the rules.

## THANK YOU
