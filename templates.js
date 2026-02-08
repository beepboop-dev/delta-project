
// ========== CONTRACT TEMPLATE LIBRARY ==========
const CONTRACT_TEMPLATES = [
  {
    id: 'nda-mutual',
    title: 'Mutual Non-Disclosure Agreement',
    category: 'Confidentiality',
    description: 'A balanced NDA where both parties agree to protect each other\'s confidential information. Ideal for partnerships, joint ventures, or business discussions.',
    riskLevel: 'low',
    commonRedFlags: ['Overbroad definition of confidential information', 'Perpetual confidentiality obligations', 'One-sided remedies for breach'],
    text: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE], by and between:

[PARTY A NAME], a [PARTY A ENTITY TYPE] organized under the laws of [PARTY A STATE], with its principal place of business at [PARTY A ADDRESS] ("Party A"),

and

[PARTY B NAME], a [PARTY B ENTITY TYPE] organized under the laws of [PARTY B STATE], with its principal place of business at [PARTY B ADDRESS] ("Party B").

Party A and Party B are collectively referred to as the "Parties" and individually as a "Party."

RECITALS

WHEREAS, the Parties wish to explore a potential business relationship concerning [PURPOSE OF DISCLOSURE] (the "Purpose"); and

WHEREAS, in connection with the Purpose, each Party may disclose to the other certain confidential and proprietary information;

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the Parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by either Party to the other Party, whether orally, in writing, or by inspection of tangible objects, that is designated as "Confidential," "Proprietary," or with a similar legend, or that a reasonable person would understand to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, but is not limited to:
(a) Business plans, strategies, and financial information;
(b) Customer and supplier lists and related data;
(c) Technical data, trade secrets, know-how, and inventions;
(d) Software, source code, and system designs;
(e) Marketing plans and product roadmaps.

2. EXCLUSIONS
Confidential Information does not include information that:
(a) Is or becomes publicly available through no fault of the Receiving Party;
(b) Was already known to the Receiving Party prior to disclosure, as evidenced by written records;
(c) Is independently developed by the Receiving Party without use of the Disclosing Party's Confidential Information;
(d) Is lawfully received from a third party without restriction on disclosure;
(e) Is required to be disclosed by law, regulation, or court order, provided that the Receiving Party gives the Disclosing Party prompt notice and cooperates in seeking a protective order.

3. OBLIGATIONS OF THE RECEIVING PARTY
Each Party, when receiving Confidential Information (the "Receiving Party"), agrees to:
(a) Use the Confidential Information solely for the Purpose;
(b) Protect the Confidential Information with at least the same degree of care it uses to protect its own confidential information, but no less than reasonable care;
(c) Limit disclosure of Confidential Information to its employees, agents, and advisors who have a need to know and are bound by confidentiality obligations at least as restrictive as those contained herein;
(d) Not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party.

4. TERM AND DURATION
This Agreement shall remain in effect for [TERM LENGTH, e.g., 2 years] from the date first written above. The confidentiality obligations shall survive termination of this Agreement for a period of [SURVIVAL PERIOD, e.g., 3 years] following the date of disclosure.

5. RETURN OF MATERIALS
Upon termination of this Agreement or upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all copies of Confidential Information and certify such destruction in writing.

6. NO LICENSE OR WARRANTY
Nothing in this Agreement grants either Party any rights in or to the other Party's Confidential Information, except the limited right to use it for the Purpose. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

7. REMEDIES
Each Party acknowledges that a breach of this Agreement may cause irreparable harm for which monetary damages may be inadequate. Accordingly, either Party may seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.

8. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of [GOVERNING STATE], without regard to its conflict of law principles.

9. DISPUTE RESOLUTION
Any dispute arising out of or relating to this Agreement shall first be submitted to good-faith mediation. If mediation is unsuccessful within [MEDIATION PERIOD, e.g., 30 days], either Party may pursue resolution in the state or federal courts located in [JURISDICTION].

10. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior or contemporaneous agreements, understandings, and communications.

11. AMENDMENTS
No amendment or modification of this Agreement shall be effective unless in writing and signed by both Parties.

12. SEVERABILITY
If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

[PARTY A NAME]
By: ___________________________
Name: [PARTY A SIGNATORY NAME]
Title: [PARTY A SIGNATORY TITLE]
Date: [DATE]

[PARTY B NAME]
By: ___________________________
Name: [PARTY B SIGNATORY NAME]
Title: [PARTY B SIGNATORY TITLE]
Date: [DATE]`
  },
  {
    id: 'nda-one-way',
    title: 'One-Way Non-Disclosure Agreement',
    category: 'Confidentiality',
    description: 'A unilateral NDA where only one party discloses confidential information. Commonly used when sharing proprietary info with potential investors, employees, or vendors.',
    riskLevel: 'medium',
    commonRedFlags: ['Overbroad definition of confidential information', 'No time limit on obligations', 'Excessive remedies for breach', 'No carve-out for independently developed information'],
    text: `ONE-WAY NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE], by and between:

[DISCLOSING PARTY NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [ADDRESS] (the "Disclosing Party"),

and

[RECEIVING PARTY NAME], [an individual residing at / a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at] [ADDRESS] (the "Receiving Party").

RECITALS

WHEREAS, the Disclosing Party possesses certain confidential and proprietary information relating to [DESCRIPTION OF INFORMATION/PROJECT]; and

WHEREAS, the Disclosing Party wishes to disclose such information to the Receiving Party for the purpose of [PURPOSE] (the "Purpose");

NOW, THEREFORE, in consideration of the disclosure of Confidential Information and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information disclosed by the Disclosing Party to the Receiving Party, whether in written, oral, electronic, or other form, including but not limited to:
(a) Trade secrets, inventions, patents, and patent applications;
(b) Business and marketing plans, financial data, and projections;
(c) Customer lists, vendor relationships, and pricing information;
(d) Software, algorithms, source code, and technical specifications;
(e) Any other information designated as confidential or that should reasonably be considered confidential.

2. EXCLUSIONS FROM CONFIDENTIAL INFORMATION
The obligations of this Agreement shall not apply to information that:
(a) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;
(b) Was in the Receiving Party's lawful possession prior to disclosure, as documented by written records;
(c) Is independently developed by the Receiving Party without use of or reference to the Confidential Information;
(d) Is rightfully obtained by the Receiving Party from a third party without restriction;
(e) Is disclosed pursuant to a valid order of a court or governmental body, provided the Receiving Party provides prior written notice to the Disclosing Party and cooperates in obtaining a protective order.

3. OBLIGATIONS OF THE RECEIVING PARTY
The Receiving Party agrees to:
(a) Hold the Confidential Information in strict confidence;
(b) Not use the Confidential Information for any purpose other than the Purpose;
(c) Not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party;
(d) Restrict access to the Confidential Information to those of its employees, agents, or advisors who need to know such information for the Purpose and who are bound by confidentiality obligations no less restrictive than those in this Agreement;
(e) Exercise at least the same degree of care to protect the Confidential Information as it uses to protect its own confidential information, but in no event less than reasonable care;
(f) Promptly notify the Disclosing Party of any unauthorized use or disclosure of the Confidential Information.

4. TERM
This Agreement shall be effective from the date first written above and shall continue for a period of [TERM LENGTH, e.g., 2 years]. The Receiving Party's obligations regarding Confidential Information shall survive for [SURVIVAL PERIOD, e.g., 5 years] from the date of each disclosure.

5. RETURN OR DESTRUCTION OF MATERIALS
Upon the Disclosing Party's request or upon termination of this Agreement, the Receiving Party shall promptly return or destroy all materials containing Confidential Information and provide written certification of such return or destruction.

6. NO LICENSE
Nothing in this Agreement grants the Receiving Party any license, interest, or right in or to the Confidential Information or any intellectual property of the Disclosing Party.

7. NO WARRANTY
THE CONFIDENTIAL INFORMATION IS PROVIDED "AS IS." THE DISCLOSING PARTY MAKES NO WARRANTIES REGARDING THE ACCURACY OR COMPLETENESS OF THE CONFIDENTIAL INFORMATION.

8. REMEDIES
The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm to the Disclosing Party. The Disclosing Party shall be entitled to seek injunctive relief without the need to post a bond, in addition to any other remedies available at law or in equity.

9. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by the laws of [GOVERNING STATE]. Any legal action arising under this Agreement shall be brought in the courts of [JURISDICTION].

10. ENTIRE AGREEMENT
This Agreement represents the entire understanding between the Parties regarding the Confidential Information and supersedes all prior discussions and agreements.

11. SEVERABILITY
If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

DISCLOSING PARTY:
[DISCLOSING PARTY NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

RECEIVING PARTY:
[RECEIVING PARTY NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]`
  },
  {
    id: 'freelance-services',
    title: 'Freelance Services Agreement',
    category: 'Services',
    description: 'A comprehensive agreement for freelance/independent contractor engagements covering scope, payment, IP ownership, and termination terms.',
    riskLevel: 'medium',
    commonRedFlags: ['Unlimited revision clauses', 'Full IP assignment without fair compensation', 'Late payment terms exceeding Net-30', 'Non-compete clauses', 'Scope creep without additional compensation'],
    text: `FREELANCE SERVICES AGREEMENT

This Freelance Services Agreement ("Agreement") is entered into as of [DATE], by and between:

[CLIENT NAME], a [ENTITY TYPE] with its principal place of business at [CLIENT ADDRESS] (the "Client"),

and

[CONTRACTOR NAME], [an individual / a [ENTITY TYPE]] located at [CONTRACTOR ADDRESS] (the "Contractor").

1. SERVICES
The Contractor shall perform the following services (the "Services"):
[DETAILED DESCRIPTION OF SERVICES]

1.1 Deliverables
The Contractor shall deliver the following (the "Deliverables"):
[LIST OF SPECIFIC DELIVERABLES]

1.2 Timeline
The Services shall be performed according to the following schedule:
- Project Start Date: [START DATE]
- [MILESTONE 1]: [MILESTONE 1 DATE]
- [MILESTONE 2]: [MILESTONE 2 DATE]
- Project Completion Date: [END DATE]

2. COMPENSATION
2.1 Fee
The Client shall pay the Contractor a total fee of $[TOTAL FEE] for the Services, structured as follows:
- $[DEPOSIT AMOUNT] due upon execution of this Agreement (non-refundable deposit)
- $[MILESTONE PAYMENT] due upon completion of [MILESTONE 1]
- $[FINAL PAYMENT] due upon final delivery and acceptance

[ALTERNATIVE: The Client shall pay the Contractor at a rate of $[HOURLY RATE] per hour, not to exceed [MAX HOURS] hours without prior written approval.]

2.2 Payment Terms
All invoices are due within [PAYMENT TERMS, e.g., 15 days] of receipt. Late payments shall accrue interest at [INTEREST RATE, e.g., 1.5%] per month.

2.3 Expenses
The Client shall reimburse the Contractor for pre-approved expenses incurred in performing the Services, upon submission of receipts.

3. REVISIONS
The fee includes [NUMBER OF REVISIONS, e.g., 3] rounds of revisions. Additional revisions beyond this scope shall be billed at $[REVISION RATE] per hour.

4. INTELLECTUAL PROPERTY
4.1 Upon full payment of all fees, the Client shall own all rights, title, and interest in the final Deliverables.
4.2 The Contractor retains ownership of all pre-existing intellectual property, tools, libraries, and methodologies used in creating the Deliverables ("Contractor IP"). The Contractor grants the Client a perpetual, non-exclusive license to use the Contractor IP as embedded in the Deliverables.
4.3 The Contractor retains the right to display the Deliverables in their portfolio and marketing materials, unless the Client provides written objection within [PORTFOLIO OPT-OUT PERIOD, e.g., 30 days] of project completion.

5. CONFIDENTIALITY
Each Party agrees to keep confidential any proprietary information received from the other Party during the performance of this Agreement. This obligation shall survive termination for a period of [CONFIDENTIALITY PERIOD, e.g., 2 years].

6. INDEPENDENT CONTRACTOR STATUS
The Contractor is an independent contractor and not an employee of the Client. The Contractor is responsible for their own taxes, insurance, and benefits.

7. TERMINATION
7.1 Either Party may terminate this Agreement with [NOTICE PERIOD, e.g., 14 days] written notice.
7.2 Upon termination, the Client shall pay the Contractor for all Services performed and expenses incurred through the date of termination.
7.3 If the Client terminates without cause, the Client shall also pay a kill fee equal to [KILL FEE PERCENTAGE, e.g., 25%] of the remaining contract value.

8. LIABILITY
8.1 The Contractor's total liability under this Agreement shall not exceed the total fees paid by the Client.
8.2 Neither Party shall be liable for any indirect, incidental, or consequential damages.

9. WARRANTY
The Contractor warrants that the Deliverables shall be original work and shall not infringe upon the intellectual property rights of any third party. The Contractor shall correct any defects in the Deliverables identified within [WARRANTY PERIOD, e.g., 30 days] of final delivery at no additional cost.

10. DISPUTE RESOLUTION
Any disputes shall first be addressed through good-faith negotiation. If unresolved within [NEGOTIATION PERIOD, e.g., 30 days], the Parties agree to submit to mediation in [MEDIATION LOCATION].

11. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

12. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties and supersedes all prior communications.

13. SEVERABILITY
If any provision is held to be unenforceable, the remaining provisions shall continue in full force and effect.

CLIENT:
[CLIENT NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

CONTRACTOR:
[CONTRACTOR NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Date: [DATE]`
  },
  {
    id: 'saas-terms',
    title: 'SaaS Terms of Service',
    category: 'Technology',
    description: 'Standard terms of service for a software-as-a-service product covering subscriptions, data handling, liability, and acceptable use.',
    riskLevel: 'medium',
    commonRedFlags: ['Unilateral modification rights', 'Broad data usage clauses', 'Warranty disclaimers', 'Low liability caps', 'Auto-renewal with long notice periods'],
    text: `TERMS OF SERVICE — [SERVICE NAME]

Effective Date: [EFFECTIVE DATE]
Last Updated: [LAST UPDATED DATE]

Welcome to [SERVICE NAME] (the "Service"), operated by [COMPANY NAME] ("Company," "we," "us," or "our"). By accessing or using the Service, you ("Customer," "you," or "your") agree to be bound by these Terms of Service ("Terms").

1. ACCEPTANCE OF TERMS
By creating an account or using the Service, you confirm that you have read, understood, and agree to these Terms. If you are accepting these Terms on behalf of an organization, you represent that you have the authority to bind that organization.

2. SERVICE DESCRIPTION
[SERVICE NAME] provides [DESCRIPTION OF SERVICE]. The Service is available via [WEB/MOBILE/API] at [SERVICE URL].

3. ACCOUNTS
3.1 You must provide accurate and complete registration information.
3.2 You are responsible for maintaining the confidentiality of your account credentials.
3.3 You must notify us immediately of any unauthorized access to your account.

4. SUBSCRIPTION AND PAYMENT
4.1 Plans and Pricing
[PLAN NAME]: $[PRICE] per [BILLING PERIOD]
[PLAN NAME]: $[PRICE] per [BILLING PERIOD]

4.2 Billing
Subscriptions are billed [in advance/in arrears] on a [monthly/annual] basis. All fees are quoted in [CURRENCY] and are non-refundable except as expressly set forth herein.

4.3 Price Changes
We may adjust pricing with at least [PRICE CHANGE NOTICE, e.g., 30 days] notice before the start of your next billing period. Continued use after the effective date constitutes acceptance.

4.4 Cancellation
You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial refunds are provided.

5. DATA OWNERSHIP AND PRIVACY
5.1 Customer Data
You retain all ownership rights in data you submit to the Service ("Customer Data").

5.2 Our Use of Customer Data
We will only use Customer Data to provide and improve the Service. We may use anonymized, aggregated data for analytics and product improvement.

5.3 Data Security
We implement industry-standard security measures to protect Customer Data. We will promptly notify you of any data breach affecting your data.

5.4 Data Portability
You may export your Customer Data at any time through the Service's export functionality.

5.5 Data Deletion
Upon account termination, we will delete your Customer Data within [DATA DELETION PERIOD, e.g., 30 days] of your request, except as required by law.

6. INTELLECTUAL PROPERTY
6.1 The Service, including all code, design, trademarks, and content, is the exclusive property of the Company.
6.2 We grant you a limited, non-exclusive, non-transferable license to use the Service during your subscription.

7. ACCEPTABLE USE
You agree not to:
(a) Use the Service for any unlawful purpose;
(b) Attempt to gain unauthorized access to the Service or its systems;
(c) Interfere with or disrupt the Service's operation;
(d) Reverse engineer, decompile, or disassemble the Service;
(e) Use the Service to transmit malicious code or spam;
(f) Resell or redistribute the Service without our written consent.

8. SERVICE LEVEL AGREEMENT
8.1 We will use commercially reasonable efforts to maintain [UPTIME TARGET, e.g., 99.9%] uptime.
8.2 In the event of downtime exceeding the SLA, you may be eligible for service credits as described in our SLA policy.
8.3 Scheduled maintenance windows will be communicated with at least [MAINTENANCE NOTICE, e.g., 48 hours] advance notice.

9. WARRANTY DISCLAIMER
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.

10. LIMITATION OF LIABILITY
10.1 IN NO EVENT SHALL THE COMPANY'S AGGREGATE LIABILITY EXCEED THE FEES PAID BY YOU IN THE [LIABILITY PERIOD, e.g., 12 MONTHS] PRECEDING THE CLAIM.
10.2 IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
10.3 These limitations shall not apply to breaches of confidentiality, intellectual property infringement, or willful misconduct.

11. INDEMNIFICATION
You agree to indemnify and hold harmless the Company from claims arising from (a) your use of the Service, (b) your violation of these Terms, or (c) your Customer Data.

12. TERMINATION
12.1 Either Party may terminate with [TERMINATION NOTICE, e.g., 30 days] written notice.
12.2 We may suspend or terminate your account immediately for material breach of these Terms.
12.3 Upon termination, you will have [POST-TERMINATION ACCESS, e.g., 30 days] to export your data.

13. MODIFICATIONS TO TERMS
We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least [TERMS CHANGE NOTICE, e.g., 30 days] before taking effect. Continued use after changes take effect constitutes acceptance.

14. GOVERNING LAW
These Terms shall be governed by the laws of [GOVERNING STATE], without regard to conflict of law principles.

15. DISPUTE RESOLUTION
15.1 Any dispute shall first be addressed through good-faith negotiation.
15.2 If unresolved within [NEGOTIATION PERIOD, e.g., 30 days], disputes shall be submitted to binding arbitration in [ARBITRATION LOCATION] under [ARBITRATION RULES, e.g., AAA Commercial Arbitration Rules].
15.3 Claims under $[SMALL CLAIMS LIMIT, e.g., 10,000] may be brought in small claims court.

16. GENERAL PROVISIONS
16.1 Severability: If any provision is held unenforceable, the remaining provisions remain in effect.
16.2 Entire Agreement: These Terms constitute the entire agreement between you and the Company regarding the Service.
16.3 Assignment: You may not assign these Terms without our written consent.
16.4 Force Majeure: Neither Party shall be liable for delays caused by circumstances beyond reasonable control.

Contact: [CONTACT EMAIL]
Address: [COMPANY ADDRESS]`
  },
  {
    id: 'consulting-agreement',
    title: 'Consulting Agreement',
    category: 'Services',
    description: 'A professional consulting agreement for advisory and consulting engagements, covering scope, fees, deliverables, and confidentiality.',
    riskLevel: 'medium',
    commonRedFlags: ['Scope creep provisions', 'Non-compete clauses', 'Broad IP assignment', 'Unlimited liability', 'Termination without payment for work completed'],
    text: `CONSULTING AGREEMENT

This Consulting Agreement ("Agreement") is entered into as of [DATE], by and between:

[COMPANY NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [COMPANY ADDRESS] (the "Company"),

and

[CONSULTANT NAME], [an individual / a [ENTITY TYPE]] located at [CONSULTANT ADDRESS] (the "Consultant").

1. ENGAGEMENT
The Company engages the Consultant to provide consulting services as described in this Agreement and any attached Statements of Work (each, an "SOW").

2. SCOPE OF SERVICES
The Consultant shall provide the following services (the "Services"):
[DETAILED DESCRIPTION OF CONSULTING SERVICES]

2.1 Statements of Work
Specific projects shall be defined in Statements of Work, which shall include:
(a) Description of services to be performed;
(b) Deliverables and acceptance criteria;
(c) Timeline and milestones;
(d) Fees and payment schedule.

3. TERM
This Agreement shall commence on [START DATE] and continue until [END DATE], unless earlier terminated in accordance with Section 10.

4. COMPENSATION
4.1 The Company shall pay the Consultant [FEE STRUCTURE]:
[OPTION A: A fixed fee of $[AMOUNT] for the Services as described in the SOW.]
[OPTION B: At an hourly rate of $[RATE] per hour, not to exceed [MAX HOURS] hours per [PERIOD] without prior written approval.]
[OPTION C: A monthly retainer of $[AMOUNT] for up to [HOURS] hours of consulting per month. Hours beyond the retainer shall be billed at $[OVERAGE RATE] per hour.]

4.2 Payment Terms
Invoices shall be submitted [INVOICE FREQUENCY, e.g., monthly] and are due within [PAYMENT TERMS, e.g., 30 days] of receipt. Late payments shall bear interest at [INTEREST RATE, e.g., 1.5%] per month.

4.3 Expenses
The Company shall reimburse the Consultant for reasonable, pre-approved travel and out-of-pocket expenses. Expenses exceeding $[EXPENSE THRESHOLD, e.g., 500] require prior written approval.

5. INDEPENDENT CONTRACTOR
5.1 The Consultant is an independent contractor, not an employee, agent, or partner of the Company.
5.2 The Consultant shall be responsible for all self-employment taxes, insurance, and benefits.
5.3 The Consultant retains the right to perform services for other clients, subject to the confidentiality and non-conflict provisions herein.

6. INTELLECTUAL PROPERTY
6.1 Pre-Existing IP: The Consultant retains all rights to intellectual property developed prior to or independently of this Agreement ("Consultant IP").
6.2 Work Product: All deliverables created specifically for the Company under this Agreement ("Work Product") shall be owned by the Company upon full payment.
6.3 License to Consultant IP: To the extent any Consultant IP is incorporated into the Work Product, the Consultant grants the Company a perpetual, non-exclusive, royalty-free license to use such Consultant IP solely as part of the Work Product.
6.4 Portfolio Rights: The Consultant may reference the engagement and display non-confidential aspects of the Work Product in their portfolio, unless the Company objects in writing within [PORTFOLIO NOTICE PERIOD, e.g., 30 days].

7. CONFIDENTIALITY
7.1 Each Party agrees to maintain the confidentiality of any proprietary or confidential information received from the other Party.
7.2 Confidential information does not include information that is publicly available, already known, independently developed, or rightfully received from a third party.
7.3 This obligation shall survive for [CONFIDENTIALITY SURVIVAL, e.g., 3 years] following termination of this Agreement.

8. NON-SOLICITATION
During the term and for [NON-SOLICIT PERIOD, e.g., 12 months] following termination, neither Party shall directly solicit the other Party's employees for employment. This does not apply to general advertising or unsolicited inquiries.

9. WARRANTIES AND LIABILITY
9.1 The Consultant warrants that the Services shall be performed in a professional and workmanlike manner consistent with industry standards.
9.2 The Consultant's total liability shall not exceed the total fees paid under this Agreement in the [LIABILITY LOOKBACK, e.g., 12 months] preceding the claim.
9.3 Neither Party shall be liable for indirect, consequential, or punitive damages.

10. TERMINATION
10.1 Either Party may terminate this Agreement with [TERMINATION NOTICE, e.g., 30 days] written notice.
10.2 Either Party may terminate immediately for material breach if the breach is not cured within [CURE PERIOD, e.g., 15 days] of written notice.
10.3 Upon termination, the Company shall pay for all Services rendered and expenses incurred through the termination date.

11. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

12. DISPUTE RESOLUTION
Disputes shall first be addressed through good-faith negotiation, then mediation, and if necessary, binding arbitration in [ARBITRATION LOCATION].

13. ENTIRE AGREEMENT
This Agreement, together with any SOWs, constitutes the entire agreement between the Parties.

14. SEVERABILITY
If any provision is held unenforceable, the remaining provisions shall continue in full force and effect.

COMPANY:
[COMPANY NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

CONSULTANT:
[CONSULTANT NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Date: [DATE]`
  },
  {
    id: 'employment-offer',
    title: 'Employment Offer Letter',
    category: 'Employment',
    description: 'A formal employment offer letter outlining position, compensation, benefits, and standard employment terms.',
    riskLevel: 'medium',
    commonRedFlags: ['At-will termination without severance', 'Broad non-compete clauses', 'IP assignment covering personal projects', 'Clawback provisions on bonuses', 'Moonlighting restrictions'],
    text: `EMPLOYMENT OFFER LETTER

[DATE]

[EMPLOYEE NAME]
[EMPLOYEE ADDRESS]

Dear [EMPLOYEE NAME],

We are pleased to offer you the position of [JOB TITLE] at [COMPANY NAME] (the "Company"). This letter outlines the terms and conditions of your employment.

1. POSITION AND DUTIES
1.1 Title: [JOB TITLE]
1.2 Department: [DEPARTMENT]
1.3 Reporting to: [MANAGER NAME], [MANAGER TITLE]
1.4 Start Date: [START DATE]
1.5 Location: [WORK LOCATION] [with the option to work remotely [NUMBER] days per week]
1.6 You will perform duties consistent with your position as may be assigned from time to time.

2. COMPENSATION
2.1 Base Salary: $[ANNUAL SALARY] per year, paid [PAYMENT FREQUENCY, e.g., bi-weekly].
2.2 Signing Bonus: $[SIGNING BONUS], payable within [BONUS PAYMENT TIMELINE, e.g., 30 days] of your start date. [If you voluntarily resign within [CLAWBACK PERIOD, e.g., 12 months], you agree to repay the signing bonus on a pro-rated basis.]
2.3 Annual Bonus: You will be eligible for an annual performance bonus of up to [BONUS PERCENTAGE]% of your base salary, based on individual and company performance, payable at the Company's discretion.

3. EQUITY
3.1 Stock Options: Subject to board approval, you will be granted [NUMBER OF SHARES] stock options under the Company's [EQUITY PLAN NAME].
3.2 Vesting: Options vest over [VESTING PERIOD, e.g., 4 years] with a [CLIFF PERIOD, e.g., 1-year] cliff, after which [VESTING RATE, e.g., 1/48th] of the shares vest monthly.
3.3 Strike Price: Determined by the fair market value at the time of grant.

4. BENEFITS
You will be eligible for the Company's standard benefits package, including:
(a) Health, dental, and vision insurance;
(b) [RETIREMENT PLAN, e.g., 401(k)] with [COMPANY MATCH, e.g., 4%] company match;
(c) [PTO DAYS, e.g., 20] days of paid time off per year;
(d) [SICK DAYS, e.g., 10] sick days per year;
(e) [ADDITIONAL BENEFITS, e.g., life insurance, disability insurance, professional development budget];
Benefits are subject to the terms of the applicable plan documents and may be modified by the Company.

5. AT-WILL EMPLOYMENT
Your employment with the Company is at-will, meaning either you or the Company may terminate the employment relationship at any time, with or without cause or notice. This at-will status cannot be altered except by a written agreement signed by you and the [AUTHORIZED OFFICER TITLE, e.g., CEO].

6. INTELLECTUAL PROPERTY
6.1 You agree that any inventions, discoveries, or works created in the course of your employment or using Company resources shall be the property of the Company.
6.2 This does not apply to inventions developed entirely on your own time, without Company resources, and unrelated to the Company's business or current/anticipated research ("Personal IP").
6.3 You will be asked to sign the Company's standard Intellectual Property Assignment Agreement.

7. CONFIDENTIALITY
You will be required to sign the Company's standard Confidentiality and Non-Disclosure Agreement. You agree to protect the Company's confidential information during and after your employment.

8. NON-COMPETE AND NON-SOLICITATION
[IF APPLICABLE:]
8.1 During your employment and for [NON-COMPETE PERIOD, e.g., 12 months] following termination, you agree not to [COMPETE RESTRICTION].
8.2 During your employment and for [NON-SOLICIT PERIOD, e.g., 12 months] following termination, you agree not to solicit Company employees or customers.
[NOTE: Non-compete provisions may not be enforceable in your jurisdiction.]

9. BACKGROUND CHECK
This offer is contingent upon satisfactory completion of a background check and [OTHER CONDITIONS, e.g., reference checks, proof of work authorization].

10. GOVERNING LAW
This offer letter shall be governed by the laws of [GOVERNING STATE].

11. ENTIRE AGREEMENT
This letter, together with the referenced agreements, constitutes the entire agreement regarding your employment and supersedes all prior representations.

To accept this offer, please sign below and return by [OFFER EXPIRATION DATE].

We are excited to welcome you to the team!

Sincerely,

___________________________
[HIRING MANAGER NAME]
[HIRING MANAGER TITLE]
[COMPANY NAME]

ACCEPTANCE:

I, [EMPLOYEE NAME], accept the offer of employment as described above.

Signature: ___________________________
Date: [DATE]`
  },
  {
    id: 'independent-contractor',
    title: 'Independent Contractor Agreement',
    category: 'Services',
    description: 'An agreement establishing an independent contractor relationship, defining work terms while maintaining proper contractor classification.',
    riskLevel: 'medium',
    commonRedFlags: ['Misclassification risk (treating contractors as employees)', 'Broad IP assignment', 'Non-compete restrictions', 'Exclusivity requirements', 'Unreasonable termination clauses'],
    text: `INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement ("Agreement") is entered into as of [DATE], by and between:

[COMPANY NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [COMPANY ADDRESS] (the "Company"),

and

[CONTRACTOR NAME], [an individual / a [ENTITY TYPE]] located at [CONTRACTOR ADDRESS] (the "Contractor").

1. SERVICES
1.1 The Company engages the Contractor to perform the services described in Exhibit A (the "Services").
1.2 The Contractor shall determine the method, details, and means of performing the Services, subject to the Company's general direction regarding the desired results.

2. TERM
This Agreement shall commence on [START DATE] and shall continue until [END DATE / completion of the Services], unless earlier terminated as provided herein.

3. COMPENSATION
3.1 The Company shall pay the Contractor [COMPENSATION STRUCTURE]:
[OPTION A: $[AMOUNT] per hour for Services rendered.]
[OPTION B: A fixed fee of $[AMOUNT] for the project, payable as follows: [PAYMENT SCHEDULE].]
[OPTION C: $[AMOUNT] per [DELIVERABLE/UNIT].]

3.2 The Contractor shall submit invoices [INVOICE FREQUENCY, e.g., bi-weekly/monthly] detailing work performed. Payment shall be made within [PAYMENT TERMS, e.g., 30 days] of receipt of a proper invoice.

3.3 The Company shall not withhold taxes from payments. The Contractor is solely responsible for all taxes, including self-employment taxes.

4. INDEPENDENT CONTRACTOR STATUS
4.1 The Contractor is an independent contractor, not an employee, agent, partner, or joint venturer of the Company.
4.2 The Contractor shall not be entitled to any employee benefits, including health insurance, retirement plans, paid time off, or workers' compensation.
4.3 The Contractor retains the right to:
  (a) Set their own hours and work schedule;
  (b) Determine the location where Services are performed;
  (c) Use their own tools and equipment;
  (d) Hire subcontractors with prior written approval from the Company;
  (e) Provide services to other clients, subject to Section 7.

5. DELIVERABLES AND ACCEPTANCE
5.1 The Contractor shall deliver the work products described in Exhibit A (the "Deliverables") by the dates specified therein.
5.2 The Company shall review each Deliverable within [REVIEW PERIOD, e.g., 10 business days] of receipt and either accept or provide specific written feedback.
5.3 If the Company does not respond within the review period, the Deliverable shall be deemed accepted.

6. INTELLECTUAL PROPERTY
6.1 Pre-Existing IP: The Contractor retains all rights to intellectual property owned by the Contractor prior to this Agreement or developed independently outside this engagement ("Contractor IP").
6.2 Work Product: Upon full payment, all Deliverables created specifically for the Company under this Agreement shall be owned by the Company.
6.3 License: The Contractor grants the Company a perpetual, non-exclusive, royalty-free license to use any Contractor IP incorporated into the Deliverables.

7. CONFIDENTIALITY
7.1 The Contractor shall not disclose any confidential information of the Company to third parties.
7.2 "Confidential Information" means non-public information designated as confidential or reasonably understood to be confidential.
7.3 Standard exclusions apply (publicly known, independently developed, rightfully received from third parties, required by law).
7.4 This obligation survives for [CONFIDENTIALITY SURVIVAL, e.g., 3 years] after termination.

8. NON-SOLICITATION
During the term and for [NON-SOLICIT PERIOD, e.g., 12 months] after termination, the Contractor shall not directly solicit Company employees. General job postings do not constitute solicitation.

9. WARRANTIES
9.1 The Contractor warrants that:
  (a) The Services will be performed in a professional and workmanlike manner;
  (b) The Deliverables will be original and will not infringe third-party rights;
  (c) The Contractor has the right and authority to enter into this Agreement.
9.2 The Contractor will correct any Deliverables that do not conform to the specifications within [WARRANTY PERIOD, e.g., 30 days] of notification.

10. LIMITATION OF LIABILITY
10.1 The Contractor's total liability shall not exceed the fees paid under this Agreement in the [LIABILITY LOOKBACK, e.g., 6 months] preceding the claim.
10.2 Neither Party shall be liable for indirect, incidental, or consequential damages.

11. INDEMNIFICATION
Each Party shall indemnify the other against claims arising from its own negligence, willful misconduct, or material breach of this Agreement.

12. TERMINATION
12.1 Either Party may terminate with [NOTICE PERIOD, e.g., 14 days] written notice.
12.2 Either Party may terminate immediately for material breach not cured within [CURE PERIOD, e.g., 10 days] of written notice.
12.3 Upon termination, the Company shall pay for all Services performed and accepted Deliverables through the termination date.
12.4 The Contractor shall deliver all completed and in-progress work upon termination.

13. INSURANCE
The Contractor shall maintain [REQUIRED INSURANCE, e.g., general liability insurance with coverage of at least $1,000,000 per occurrence] during the term of this Agreement.

14. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

15. DISPUTE RESOLUTION
Disputes shall be resolved first through negotiation, then mediation in [MEDIATION LOCATION], and if necessary, binding arbitration.

16. MISCELLANEOUS
16.1 Entire Agreement: This Agreement constitutes the entire agreement between the Parties.
16.2 Amendments: Must be in writing and signed by both Parties.
16.3 Severability: Invalid provisions shall not affect the remainder.
16.4 Assignment: Neither Party may assign without written consent.

COMPANY:
[COMPANY NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

CONTRACTOR:
[CONTRACTOR NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Date: [DATE]

EXHIBIT A: SCOPE OF WORK
[DETAILED SCOPE, DELIVERABLES, TIMELINE, AND FEES]`
  },
  {
    id: 'software-license',
    title: 'Software License Agreement',
    category: 'Technology',
    description: 'A software license agreement for commercial or enterprise software, covering usage rights, restrictions, support, and liability.',
    riskLevel: 'medium',
    commonRedFlags: ['Warranty disclaimers', 'Low liability caps', 'Audit rights', 'Automatic price increases', 'Restrictive usage terms'],
    text: `SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into as of [DATE], by and between:

[LICENSOR NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [LICENSOR ADDRESS] (the "Licensor"),

and

[LICENSEE NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [LICENSEE ADDRESS] (the "Licensee").

1. DEFINITIONS
1.1 "Software" means [SOFTWARE NAME] version [VERSION], including all updates and patches provided during the license term.
1.2 "Documentation" means all user manuals, technical specifications, and help files provided with the Software.
1.3 "Authorized Users" means the Licensee's employees and contractors who are authorized to use the Software, not to exceed [NUMBER OF USERS] users.
1.4 "License Key" means the unique activation code provided to the Licensee.

2. GRANT OF LICENSE
2.1 Subject to the terms of this Agreement and payment of all applicable fees, the Licensor grants to the Licensee a [non-exclusive / exclusive], [non-transferable / transferable], [LICENSE SCOPE, e.g., worldwide] license to:
  (a) Install and use the Software on [NUMBER OF INSTALLATIONS] [computers / servers];
  (b) Allow up to [NUMBER OF USERS] Authorized Users to access the Software;
  (c) Make one (1) backup copy of the Software for archival purposes;
  (d) Use the Documentation in connection with authorized use of the Software.

3. LICENSE RESTRICTIONS
The Licensee shall NOT:
  (a) Copy, modify, or create derivative works of the Software;
  (b) Reverse engineer, decompile, or disassemble the Software;
  (c) Rent, lease, lend, sell, sublicense, or distribute the Software;
  (d) Remove or alter any proprietary notices in the Software;
  (e) Use the Software to develop competing products;
  (f) Exceed the authorized number of users or installations;
  (g) Use the Software for illegal purposes.

4. FEES AND PAYMENT
4.1 License Fee: $[LICENSE FEE] [one-time / per year / per month].
4.2 Payment is due within [PAYMENT TERMS, e.g., 30 days] of the invoice date.
4.3 Late payments shall accrue interest at [INTEREST RATE, e.g., 1.5%] per month.
4.4 All fees are exclusive of taxes. The Licensee is responsible for all applicable taxes.

5. TERM AND RENEWAL
5.1 This Agreement shall be effective for [LICENSE TERM, e.g., 1 year] from the date of execution.
5.2 [FOR SUBSCRIPTION: The license shall automatically renew for successive [RENEWAL TERM, e.g., 1-year] periods unless either Party provides written notice of non-renewal at least [RENEWAL NOTICE, e.g., 60 days] prior to the end of the current term.]
5.3 [Renewal pricing may increase by up to [MAX INCREASE, e.g., 5%] per year, with notice provided at least [PRICE NOTICE, e.g., 60 days] before renewal.]

6. SUPPORT AND MAINTENANCE
6.1 The Licensor shall provide [SUPPORT LEVEL, e.g., standard] support during the license term, including:
  (a) Bug fixes and patches;
  (b) [SUPPORT HOURS, e.g., Business hours (9 AM - 5 PM EST, Monday-Friday)] technical support via [SUPPORT CHANNELS, e.g., email and phone];
  (c) Access to software updates and new minor versions.

6.2 Response Times:
  - Critical issues: [CRITICAL RESPONSE, e.g., 4 hours]
  - Major issues: [MAJOR RESPONSE, e.g., 1 business day]
  - Minor issues: [MINOR RESPONSE, e.g., 3 business days]

6.3 Major version upgrades [are / are not] included and may require additional fees.

7. WARRANTY
7.1 The Licensor warrants that, for a period of [WARRANTY PERIOD, e.g., 90 days] from delivery:
  (a) The Software shall perform materially in accordance with the Documentation;
  (b) The Software shall be free from material defects;
  (c) The Licensor has the right to grant the license herein.

7.2 The Licensee's sole remedy for breach of warranty shall be, at the Licensor's option: (a) repair or replacement of the Software; or (b) a refund of the license fee.

7.3 EXCEPT AS EXPRESSLY SET FORTH ABOVE, THE SOFTWARE IS PROVIDED "AS IS." THE LICENSOR DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED.

8. LIMITATION OF LIABILITY
8.1 THE LICENSOR'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE LICENSE FEES PAID BY THE LICENSEE IN THE [LIABILITY PERIOD, e.g., 12 MONTHS] PRECEDING THE CLAIM.
8.2 IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
8.3 These limitations shall not apply to breaches of license restrictions, confidentiality obligations, or indemnification obligations.

9. INTELLECTUAL PROPERTY
9.1 The Licensor retains all intellectual property rights in the Software.
9.2 The Licensee receives no ownership rights in the Software.
9.3 The Licensor shall indemnify the Licensee against third-party claims that the Software infringes valid intellectual property rights.

10. CONFIDENTIALITY
Each Party shall maintain the confidentiality of the other Party's proprietary information. This obligation survives for [CONFIDENTIALITY PERIOD, e.g., 3 years] after termination.

11. AUDIT RIGHTS
The Licensor may audit the Licensee's use of the Software [AUDIT FREQUENCY, e.g., once per year] upon [AUDIT NOTICE, e.g., 30 days] written notice to verify compliance with this Agreement. Audits shall be conducted during normal business hours with minimal disruption.

12. TERMINATION
12.1 Either Party may terminate with [TERMINATION NOTICE, e.g., 30 days] written notice.
12.2 Either Party may terminate immediately for material breach not cured within [CURE PERIOD, e.g., 30 days] of written notice.
12.3 Upon termination, the Licensee shall cease using the Software and destroy all copies.

13. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

14. DISPUTE RESOLUTION
Disputes shall be resolved through negotiation, mediation, and if necessary, litigation in the courts of [JURISDICTION].

15. MISCELLANEOUS
15.1 Entire Agreement; 15.2 Amendments require written consent; 15.3 Severability; 15.4 Force Majeure; 15.5 No waiver.

LICENSOR:
[LICENSOR NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

LICENSEE:
[LICENSEE NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]`
  },
  {
    id: 'partnership-agreement',
    title: 'Partnership Agreement',
    category: 'Business Formation',
    description: 'A general partnership agreement covering capital contributions, profit sharing, management, and dissolution terms.',
    riskLevel: 'high',
    commonRedFlags: ['Joint and several liability', 'Personal guarantees', 'Broad non-compete clauses', 'Unequal exit terms', 'Unclear dissolution procedures'],
    text: `PARTNERSHIP AGREEMENT

This Partnership Agreement ("Agreement") is entered into as of [DATE], by and between:

[PARTNER A NAME], [an individual residing at / a [ENTITY TYPE] located at] [PARTNER A ADDRESS] ("Partner A"),

and

[PARTNER B NAME], [an individual residing at / a [ENTITY TYPE] located at] [PARTNER B ADDRESS] ("Partner B"),

[and [PARTNER C NAME], [an individual residing at / a [ENTITY TYPE] located at] [PARTNER C ADDRESS] ("Partner C"),]

collectively referred to as the "Partners."

1. PARTNERSHIP NAME AND PURPOSE
1.1 The Partners hereby form a general partnership under the name "[PARTNERSHIP NAME]" (the "Partnership").
1.2 The principal place of business shall be [BUSINESS ADDRESS].
1.3 The purpose of the Partnership is to [BUSINESS PURPOSE].

2. TERM
The Partnership shall commence on [START DATE] and shall continue until dissolved in accordance with this Agreement.

3. CAPITAL CONTRIBUTIONS
3.1 Each Partner shall contribute the following:
  - Partner A: $[AMOUNT] [in cash / in cash and [DESCRIPTION OF NON-CASH CONTRIBUTION]]
  - Partner B: $[AMOUNT] [in cash / in cash and [DESCRIPTION OF NON-CASH CONTRIBUTION]]
  [- Partner C: $[AMOUNT]]

3.2 Additional capital contributions may be required upon unanimous consent of the Partners.
3.3 No Partner shall withdraw any capital contribution without unanimous consent.

4. PROFIT AND LOSS SHARING
4.1 Profits and losses shall be allocated as follows:
  - Partner A: [PARTNER A PERCENTAGE]%
  - Partner B: [PARTNER B PERCENTAGE]%
  [- Partner C: [PARTNER C PERCENTAGE]%]

4.2 Distributions shall be made [DISTRIBUTION FREQUENCY, e.g., quarterly], provided the Partnership maintains a minimum operating reserve of $[RESERVE AMOUNT].
4.3 Each Partner shall receive a guaranteed payment (draw) of $[DRAW AMOUNT] per [PERIOD], deducted from their share of profits.

5. MANAGEMENT AND VOTING
5.1 Each Partner shall have an equal voice in the management and conduct of the Partnership business.
5.2 Routine business decisions may be made by any Partner individually.
5.3 The following decisions require [unanimous / majority] consent:
  (a) Expenditures exceeding $[THRESHOLD];
  (b) Hiring or terminating employees;
  (c) Entering into contracts exceeding $[CONTRACT THRESHOLD] in value;
  (d) Borrowing funds on behalf of the Partnership;
  (e) Acquiring or disposing of Partnership property;
  (f) Admitting new Partners.

6. DUTIES AND RESPONSIBILITIES
6.1 Partner A shall be responsible for: [PARTNER A RESPONSIBILITIES]
6.2 Partner B shall be responsible for: [PARTNER B RESPONSIBILITIES]
[6.3 Partner C shall be responsible for: [PARTNER C RESPONSIBILITIES]]
6.4 Each Partner shall devote [REQUIRED TIME COMMITMENT, e.g., full-time] to the Partnership business.

7. PARTNERSHIP ACCOUNTS
7.1 The Partnership shall maintain complete and accurate books of account.
7.2 Books shall be kept at the principal place of business and shall be available for inspection by any Partner at reasonable times.
7.3 The Partnership's fiscal year shall end on [FISCAL YEAR END, e.g., December 31].

8. NON-COMPETE
During the term and for [NON-COMPETE PERIOD, e.g., 2 years] following a Partner's withdrawal or dissolution:
8.1 No Partner shall engage in a competing business within [GEOGRAPHIC RESTRICTION, e.g., 50 miles of the principal place of business].
8.2 "Competing business" means [DEFINITION OF COMPETING BUSINESS].

9. CONFIDENTIALITY
All Partnership information shall be kept confidential during and after the Partnership. This obligation survives for [CONFIDENTIALITY SURVIVAL, e.g., 5 years] after dissolution or withdrawal.

10. WITHDRAWAL OF A PARTNER
10.1 Any Partner may withdraw by providing [WITHDRAWAL NOTICE, e.g., 180 days] written notice to the other Partners.
10.2 The withdrawing Partner's interest shall be valued by [VALUATION METHOD, e.g., an independent appraiser selected by mutual agreement].
10.3 The remaining Partners shall purchase the withdrawing Partner's interest, payable over [BUYOUT PERIOD, e.g., 24 months] at [BUYOUT INTEREST RATE, e.g., the prime rate plus 2%] annual interest.

11. DEATH OR DISABILITY
11.1 Upon the death or permanent disability of a Partner, the remaining Partners shall have the option to purchase the deceased/disabled Partner's interest at the appraised value.
11.2 Payment shall be made over [DEATH BUYOUT PERIOD, e.g., 36 months].
11.3 The Partners agree to maintain [LIFE INSURANCE REQUIREMENT, e.g., key person life insurance policies] to fund such buyouts.

12. EXPULSION
A Partner may be expelled by [EXPULSION VOTE, e.g., unanimous vote of the other Partners] for:
(a) Material breach of this Agreement;
(b) Willful misconduct or gross negligence;
(c) Criminal conviction related to the Partnership business;
(d) Bankruptcy or insolvency.

13. DISSOLUTION
13.1 The Partnership shall dissolve upon:
  (a) Unanimous written consent of the Partners;
  (b) The occurrence of any event making it unlawful to continue;
  (c) By court order.
13.2 Upon dissolution, Partnership assets shall be liquidated and applied in the following order:
  (a) Payment of debts and obligations to creditors;
  (b) Repayment of Partner capital contributions;
  (c) Distribution of remaining assets per profit-sharing percentages.

14. LIABILITY
The Partners shall be jointly and severally liable for Partnership obligations. Each Partner shall indemnify the other Partners from liabilities arising from their individual negligence or misconduct.

15. DISPUTE RESOLUTION
Disputes shall first be addressed through good-faith negotiation. If unresolved within [NEGOTIATION PERIOD, e.g., 30 days], disputes shall be submitted to mediation in [MEDIATION LOCATION], then binding arbitration if necessary.

16. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

17. MISCELLANEOUS
17.1 Entire Agreement; 17.2 Amendments require unanimous written consent; 17.3 Severability; 17.4 No assignment without consent.

Partner A: ___________________________
[PARTNER A NAME]
Date: [DATE]

Partner B: ___________________________
[PARTNER B NAME]
Date: [DATE]

[Partner C: ___________________________
[PARTNER C NAME]
Date: [DATE]]`
  },
  {
    id: 'non-compete',
    title: 'Non-Compete Agreement',
    category: 'Employment',
    description: 'A standalone non-compete agreement restricting competitive activities after employment or business relationship ends.',
    riskLevel: 'high',
    commonRedFlags: ['Overly broad geographic scope', 'Excessive duration', 'Vague definition of competing activities', 'No consideration provided', 'One-sided enforcement'],
    text: `NON-COMPETE AGREEMENT

This Non-Compete Agreement ("Agreement") is entered into as of [DATE], by and between:

[COMPANY NAME], a [ENTITY TYPE] organized under the laws of [STATE], with its principal place of business at [COMPANY ADDRESS] (the "Company"),

and

[INDIVIDUAL NAME], an individual residing at [INDIVIDUAL ADDRESS] (the "Restricted Party").

RECITALS

WHEREAS, the Restricted Party [is an employee of / is entering into a business relationship with / is acquiring an interest in] the Company; and

WHEREAS, in connection with such relationship, the Restricted Party will have access to the Company's confidential information, trade secrets, customer relationships, and proprietary business methods; and

WHEREAS, the Company has a legitimate business interest in protecting its confidential information, customer relationships, and goodwill;

NOW, THEREFORE, in consideration of [CONSIDERATION, e.g., continued employment, the sum of $[AMOUNT], access to confidential information, stock options], the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

1. NON-COMPETE COVENANT
1.1 During the Restricted Period (defined below), the Restricted Party shall not, directly or indirectly:
  (a) Own, manage, operate, control, or participate in any business that competes with the Company's business;
  (b) Serve as an officer, director, employee, partner, consultant, or independent contractor for any Competing Business;
  (c) Assist any person or entity in establishing or operating a Competing Business;
  (d) Invest in any Competing Business, except for passive ownership of less than [PASSIVE INVESTMENT THRESHOLD, e.g., 5%] of publicly traded securities.

1.2 "Competing Business" means any business that [DEFINITION OF COMPETING BUSINESS, e.g., provides [SPECIFIC PRODUCTS/SERVICES] to [TARGET MARKET]].

2. NON-SOLICITATION OF CUSTOMERS
During the Restricted Period, the Restricted Party shall not directly or indirectly solicit, contact, or do business with any customer or prospective customer of the Company with whom the Restricted Party had contact or about whom the Restricted Party obtained confidential information during the [LOOKBACK PERIOD, e.g., last 24 months] of the relationship.

3. NON-SOLICITATION OF EMPLOYEES
During the Restricted Period, the Restricted Party shall not directly or indirectly solicit, recruit, hire, or encourage any employee or contractor of the Company to leave the Company's employment or engagement. This restriction does not apply to general advertising not specifically directed at Company personnel.

4. RESTRICTED PERIOD
The restrictions in this Agreement shall apply during the term of the Restricted Party's relationship with the Company and for a period of [RESTRICTED PERIOD, e.g., 12 months] following the termination of such relationship, regardless of the reason for termination.

5. GEOGRAPHIC SCOPE
The restrictions in this Agreement shall apply within [GEOGRAPHIC SCOPE, e.g., the United States / within a [RADIUS]-mile radius of any Company office / within the states of [LIST STATES]].

6. CONSIDERATION
In exchange for the Restricted Party's agreement to the restrictions herein, the Company provides the following consideration:
[DESCRIPTION OF CONSIDERATION, e.g., continued at-will employment, a signing bonus of $[AMOUNT], access to confidential information and trade secrets, stock options as described in [EQUITY AGREEMENT]].

7. GARDEN LEAVE [OPTIONAL]
[During the Restricted Period, the Company shall pay the Restricted Party [GARDEN LEAVE PAYMENT, e.g., 50% of their base salary at the time of termination] as compensation for the restrictions herein.]

8. REMEDIES
8.1 The Restricted Party acknowledges that a breach of this Agreement would cause irreparable harm to the Company.
8.2 The Company shall be entitled to seek temporary and permanent injunctive relief, without the necessity of proving actual damages or posting a bond.
8.3 The Company shall also be entitled to recover monetary damages, including lost profits and attorney's fees.
8.4 The Restricted Period shall be extended by any period during which the Restricted Party is in violation of this Agreement.

9. REASONABLENESS
The Restricted Party acknowledges that the restrictions contained in this Agreement are reasonable in scope, duration, and geographic area, and are necessary to protect the Company's legitimate business interests.

10. JUDICIAL MODIFICATION
If any court of competent jurisdiction determines that any provision of this Agreement is unreasonable or unenforceable, the court is authorized to modify such provision to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force and effect.

11. DISCLOSURE OF AGREEMENT
The Restricted Party agrees to disclose the existence of this Agreement to any prospective employer or business partner during the Restricted Period.

12. GOVERNING LAW
This Agreement shall be governed by the laws of [GOVERNING STATE].

[NOTE: Non-compete agreements are unenforceable or restricted in several jurisdictions, including California, Colorado, Minnesota, North Dakota, and Oklahoma. Consult with an attorney licensed in your jurisdiction before relying on this agreement.]

13. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties regarding the subject matter hereof.

14. SEVERABILITY
If any provision is held unenforceable, the remaining provisions shall continue in full force and effect.

COMPANY:
[COMPANY NAME]
By: ___________________________
Name: [SIGNATORY NAME]
Title: [SIGNATORY TITLE]
Date: [DATE]

RESTRICTED PARTY:
___________________________
[INDIVIDUAL NAME]
Date: [DATE]`
  }
];

module.exports = { CONTRACT_TEMPLATES };
