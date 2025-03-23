---
title: "Sports Life"
slug: labcorp
date: 2021-03-31
tags: code
---

# Healthcare Testing Kit Marketplace

**[previous case study link] [all case studies link] [next case study link]**

**[Header Image]**

## The Client

![image-20230705024824324](images/labcorp/image-20230705024824324.png)

Labcorp OnDemand is an e-commerce site for testing services including pregnancy, PSA, vitamin deficiencies, COVID, and other medical screenings. Clients purchase tests, schedule collections, receive results, and receive further referrals based on test results through the site. Samples are collected at partner pharmacies and physician offices.

**Location:** Burlington, North Carolina
**Industry:** Medical Testing
**Timeline:** September, 2019 to March, 2020

## The Challenge

Prior to deployment of the OnDemand e-commerce site, testing services at Labcorp involved numerous backend services, with inconsistent provisioning and high training costs at partner collection sites. Backing services include GE Centricity EMR (electronic medical records), LabCollector LIMS (Laboratory Information Management System), and SAP Business ByDesign ERM (enterprise resource management).

The client sought to provide an e-commerce site for their medical testing products, providing product information, payment services, and report delivery for customers online and removing those responsibilities from providers to save both time and money for their clients and partners.

They also sought to unify access to the disparate backend systems for collection providers and to provide a portal with a single access point for

## Requirements

- Build an attractive and easy-to-use medical testing service marketplace to drive more customers and increase sales.
- Create an efficient content management system for the client's testing products to maintain up-to-date product information.
- Provide an optimized payment workflow for customers and maintain updated payment status in the collection provider portal.
- Automate the collection scheduling process with geospatial search to help customers find the most convenient collection site, ability for collection partners to set availability and office closed statuses, and notifying collection partners of scheduled appointments through the collection provider portal.
- Build a convenient collection provider portal with access to the scheduling system and ability to set appointment and walk-in availability, customer order information, up-to-date information on service packages, and documentation on collection requirement protocols.
- Generate barcoded collection sample labeling, mailing labels and instructions for collection provider personnel based on the category of test, and update backend systems correctly.
- Build a PWA to make the online marketplace for medical testing products mobile-friendly.
- Integrate with multiple third-party services including payment gateway, geocoding, ERP, EMR, and LIMS APIs.

**[3 Screen Shots in Carousel]**

## The Solution

At project launch the client had experienced several delays in migrating their on-premise LIMS system to an AWS cloud-hosted LIMS due to HIPAA compliance issues. Due to the unavailability of backend systems, the e-commerce frontend was implemented first using Swagger to mock the API.

### Headless CMS

Working with the client's contracted design agency and in-house content creators, we implemented a headless CMS using a self hosted platform. The marketplace was relatively small with about fifty items. As a result of the CMS software development, our client could systematize and automate the processes of creating and organizing their testing kit content.

Built a responsive, SEO-friendly and easy-to-navigate medical test marketplace that boosted Labcorp's web presence and sales, while eliminating multiple customer pain points. A convenient CMS, a simple interface to the scheduling system for test sample collection, online access to results, and referrals for further treatment gained the trust of customers nationwide. Customers can locate collection providers near them using custom styled pop-ups with provider addresses and real-time availability information, with distance and duration indicators. To build this functionality, we used Google Distance Matrix API.

Implemented a Progressive Web App, providing enhanced user experience and made the medical test website mobile-friendly, improving OnDemand's conversion rate and customer confidence.

### CMS Administration Panel

Developed an effective and easy-to-manage content management system for the medical testing product site. As a result, our client could systematize and automate the processes of creating and organizing product pricing and information and content for collection providers.

The application created has an effective and easy-to-manage administration panel, allowing the client to update the site when necessary.

### API Middleware Server

We provided an Express server to provide a single access point for the headless frontend to sensitive backend services, including customer medical records, partner collection scheduling, and payment information. The API was full documented with Swagger to enable frontend feature build out on a separate track from backing service availability.

Established synchronization of data between the marketplace for medical testing products, the collection provider portal, and backend LIMS, EMR, and EMR platforms.

### Collection Provider Portal

Created a B2B app for OnDemand's collection partners and regional sales offices based on React Admin. The portal provided user management features based on organization and roles, an interface to the third-party scheduling system with integrated authentication, document management features, HIPAA-compliant access to the LIMS and EMR backends, and an interface to LabTAG barcode label printers.

Provided comprehensive analytics views for defined KPIs utilizing multiple graph visualizations. Included export features to CSV for flexible analysis of marketplace statistics and collection provider data with role-based access control.

### Cloud Deployment

The client was nearing completion of a multi-year migration from on-premise hosting for various line of business systems to an AWS cloud platform. Our solution included a complete Git-based IaC deployment strategy within the client's AWS organization with continuous integration and deployment. A containerized self-hosted instance of Strapi CMS was deployed to AWS EC2. A build pipeline was provided for NextJS with assets served by CDN and Lambdas for social network preview generations. The API server was deployed on a managed Kubernetes cluster for scalability, with enterprise SSO integrated with the client's existing IAMs provisioning. We provided real time analytics using an ELK stack (Elasticsearch, Logstash and Kibana).

## Tools & Technologies

- Dockerized Strapi CMS
- NextJS and React with image optimization, analytics, and static site generation
- React Admin and ReChart (based on D3)
- Amazon RDS for PostgreSQL
- Express, Swagger, and PM2 process management
- AWS EC2, Lambda, CloudFront CDN, EKS, and IAM Identity
- AWS Cognito
- AWS CodeCommit, SNS, and CircleCI
- AWS Log Analytics

## The Results

We provided a comprehensive solution for Labcorp's OnDemand medical testing business with our principal providing lead developer services, and three contracted freelance developers in both backend and frontend roles. Our services included project management and lead experience utilizing agile methodologies.


## Similar Project Idea? Discuss It With Us!

[Button to Contact Page]