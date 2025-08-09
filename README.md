# NostrOracle Product Requirements Document (PRD)

  

**Project Name:** NostrOracle

**Version:** 1.0.0 (MVP)

**Date:** August 9, 2025

**Author:** Prakhar Srivastava, Bhavya Jain

  

## Original Requirements

  
The NostrOracle project is an AI-powered content authenticity validator for Nostr that:

- Analyzes posts from the Nostr network

- Extracts factual claims from posts

- Verifies claims against news sources using NewsAPI

- Publishes credibility scores back to the Nostr network

  

## 1. Product Definition

  

### 1.1 Product Goals

  

1. **Enhance Information Integrity**: Provide a trustworthy mechanism to validate factual claims on the Nostr network, reducing the spread of misinformation.

2. **Empower Users**: Enable Nostr users to quickly assess the credibility of content they consume without leaving the Nostr ecosystem.

3. **Create Transparency**: Establish an open and transparent process for content verification that builds trust within the decentralized social media space.

  

### 1.2 User Stories

  

1. **As a Nostr user**, I want factual claims in posts to be automatically verified, so that I can trust the information I'm consuming.

2. **As a content creator**, I want my factually accurate posts to receive high credibility scores, so that my audience knows they can trust my content.

3. **As a developer**, I want to integrate with the NostrOracle API, so that I can display credibility scores in my Nostr client application.

4. **As a researcher**, I want to manually verify specific content through an API endpoint, so that I can check questionable claims outside the automated process.

5. **As a relay operator**, I want the verification process to be lightweight and efficient, so that it doesn't overload my server resources.

  

### 1.3 Competitive Analysis

  

#### 1.3.1 Fact-Checking Services

  

1. **Factcheck.org**

- **Pros**: Comprehensive research by human fact-checkers, high accuracy

- **Cons**: Manual process, slow turnaround time, not integrated with social platforms

  

2. **Snopes**

- **Pros**: Well-established reputation, detailed explanations, broad coverage

- **Cons**: Limited API capabilities, not real-time, not specifically designed for decentralized networks

  

3. **NewsGuard**

- **Pros**: Evaluates entire news sources for credibility, browser extension

- **Cons**: Focuses on sources rather than individual claims, centralized solution

  

4. **FactStream**

- **Pros**: Real-time fact checking during live events

- **Cons**: Limited coverage, not automated, not integrated with social media

  

5. **ClaimBuster**

- **Pros**: AI-powered, identifies check-worthy claims

- **Cons**: Doesn't perform verification itself, requires human follow-up

  

6. **Nostr-Verify (Conceptual)**

- **Pros**: Similar concept but focuses on verifying user identities rather than content

- **Cons**: Does not address content verification needs

  

7. **Truth Social's TruthScores**

- **Pros**: Integrated scoring system

- **Cons**: Closed ecosystem, opaque scoring methodology, centralized control

  

### 1.4 Competitive Quadrant Chart
quadrantChart

title "Content Verification Solutions Comparison"

x-axis "Low Integration" --> "High Integration"

y-axis "Low Automation" --> "High Automation"

quadrant-1 "AI-Powered Integration"

quadrant-2 "Manual Integration"

quadrant-3 "Manual Standalone"

quadrant-4 "Automated Standalone"

"Factcheck.org": [0.15, 0.25]

"Snopes": [0.2, 0.3]

"NewsGuard": [0.4, 0.35]

"FactStream": [0.3, 0.2]

"ClaimBuster": [0.45, 0.65]

"Nostr-Verify": [0.75, 0.35]

"Truth Social": [0.8, 0.5]

"NostrOracle": [0.85, 0.8]
  


  

## 2. Technical Specifications

  

### 2.1 Requirements Analysis

  

NostrOracle operates within the unique constraints and capabilities of the Nostr protocol, which is a decentralized social network built on simple, open protocols. The system must efficiently connect to Nostr relays, monitor the network for new posts, analyze content, verify claims, and publish credibility scores back to the network.

  

#### Nostr Protocol Background

Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol that enables a censorship-resistant and global social network. Key aspects:

  

- **Decentralized Architecture**: No central server; relays can be run by anyone

- **Public Key Cryptography**: Users are identified by their public keys

- **Simple Event Format**: All content is formatted as "events" with standardized fields

- **Relay System**: Events are published to and fetched from relays

- **Event Kinds**: Different types of events for different purposes (text notes, reactions, etc.)

  

Key technical considerations for NostrOracle include:

  

1. **Nostr Protocol Integration**: The system must implement Nostr's event system, cryptographic verification, and relay communication.

2. **Real-time Processing**: Content verification should happen quickly to be relevant to ongoing conversations.

3. **Claim Extraction Accuracy**: The system must accurately identify factual claims within conversational text.

4. **Verification Source Quality**: The system should consider the reliability of news sources when scoring claims.

5. **Scoring Transparency**: The methodology for calculating credibility scores must be clear and consistent.

6. **Resource Efficiency**: As a 1-day MVP, the system should be lightweight and efficient.

7. **API Accessibility**: The system should provide endpoints for manual verification and score retrieval.

  

### 2.2 Requirements Pool

  

#### P0 (Must-Have)

1. Connect to multiple Nostr relays and maintain stable connections

2. Monitor real-time posts on the Nostr network

3. Extract factual claims from post content using pattern matching

4. Verify claims against reputable news sources via NewsAPI

5. Generate credibility scores (0-100) based on verification results

6. Publish scores back to the Nostr network as custom events

7. Provide API endpoints for manual verification and score retrieval

8. Implement proper error handling for API failures and network issues

  

#### P1 (Should-Have)

1. Support for basic filtering of posts to focus on content-rich messages

2. Implement caching to avoid redundant verification of identical claims

3. Track and display verification statistics (processed posts, average scores)

4. Handle rate limiting for external APIs (particularly NewsAPI)

5. Basic logging system for debugging and monitoring

6. Configuration options for relay connections and scoring parameters

  

#### P2 (Nice-to-Have)

1. Advanced claim extraction using NLP techniques

2. Multiple verification sources beyond NewsAPI

3. User reputation system to factor in past content credibility

4. Web dashboard for monitoring system performance

5. Persistent storage of verification results

6. Customizable scoring algorithms

  

### 2.3 System Architecture

  

The NostrOracle MVP consists of five main components:

  

1. **index.js**: Main server application and API endpoint handlers

- Initializes the system

- Handles HTTP requests

- Coordinates between components

- Serves API responses

  

2. **config.js**: Configuration and environment variables

- Stores API keys

- Defines relay URLs

- Sets system parameters

- Manages environment variables

  

3. **nostr-client.js**: Nostr network interactions

- Establishes and maintains connections to relays

- Subscribes to relevant events

- Filters incoming content

- Publishes credibility scores back to the network

  

4. **verifier.js**: Claim extraction and verification logic

- Parses post content to identify factual claims

- Queries NewsAPI for relevant articles

- Analyzes search results for verification

- Returns verification status and sources

  

5. **scorer.js**: Credibility scoring algorithm

- Evaluates verification results

- Considers source quality and relevance

- Calculates final credibility score (0-100)

- Provides confidence level assessment

  

### 2.4 API Design

  

#### 2.4.1 GET /

**Purpose**: Provide server status and statistics

**Response**:

```json

{

"status": "online",

"uptime": "1d 2h 34m",

"stats": {

"postsProcessed": 1205,

"claimsVerified": 843,

"averageScore": 68

},

"relays": {

"connected": 4,

"urls": ["wss://relay.damus.io", "wss://relay.nostr.info"]

}

}

```

  

#### 2.4.2 GET /scores

**Purpose**: Retrieve the last 20 credibility assessments

**Response**:

```json

{

"scores": [

{

"eventId": "abc123...",

"content": "Bitcoin reached $50,000 yesterday according to CoinDesk",

"score": 85,

"timestamp": "2025-08-09T08:15:30Z",

"claims": [

{

"text": "Bitcoin reached $50,000 yesterday",

"credibility": 85,

"sources": [

{

"title": "Bitcoin Surpasses $50K Mark",

"url": "https://example.com/article",

"source": "CoinDesk"

}

]

}

]

}

// Additional score objects would be included here

]

}

```

  

#### 2.4.3 POST /verify

**Purpose**: Manually verify content

**Request**:

```json

{

"content": "NASA announced a new Mars rover mission launching in 2026",

"eventId": "optional-event-id"

}

```

**Response**:

```json

{

"eventId": "optional-event-id",

"content": "NASA announced a new Mars rover mission launching in 2026",

"claims": [

"NASA announced a new Mars rover mission launching in 2026"

],

"verificationResults": [

{

"claim": "NASA announced a new Mars rover mission launching in 2026",

"credibility": 75,

"sources": [

{

"title": "NASA Plans New Mars Mission",

"source": "Space News",

"url": "https://example.com/nasa-mars"

}

],

"confidence": "high"

}

],

"score": 75,

"timestamp": "2025-08-09T10:00:00.000Z"

}

```

  

### 2.5 UI Design Draft

  

As this is an API-first project without a dedicated frontend in the MVP, the UI components will be minimal. However, the API responses are designed to support client implementations with relevant data.

  

For future UI development, the system should support:

  

1. **Score Badge**: A simple visual indicator showing the credibility score

2. **Verification Details**: Expandable section showing claims and sources

3. **Source Links**: Direct access to verification sources

4. **Confidence Indicator**: Visual representation of the confidence level

  

### 2.6 Data Models

  

#### 2.6.1 Nostr Event (Input)

```javascript

{

id: "hex string", // Event ID

pubkey: "hex string", // Author's public key

created_at: 1691577689, // Unix timestamp

kind: 1, // Event kind (1 = text note)

tags: [], // Array of tags

content: "The actual post content", // Text content to analyze

sig: "hex string"  // Signature

}

```

  

#### 2.6.2 Claim Object

```javascript

{

text: "The extracted factual claim",

credibility: 75, // Score from 0-100

sources: [

{

title: "Article title",

source: "News source name",

url: "https://example.com/article"

}

],

confidence: "high"  // Confidence level (low, medium, high)

}

```

  

#### 2.6.3 Verification Result

```javascript

{

eventId: "original-event-id",

content: "Original content",

claims: ["Extracted claim 1", "Extracted claim 2"],

verificationResults: [

// Claim objects as defined above

],

score: 75, // Overall credibility score

timestamp: "2025-08-09T10:00:00.000Z"

}

```

  

#### 2.6.4 Nostr Score Event (Output)

```javascript

{

kind: 39000, // Custom kind for credibility scores

pubkey: "hex string", // Oracle's public key

created_at: 1691577750, // Unix timestamp

tags: [

["e", "original-event-id"], // Reference to the original event

["score", "75"], // Credibility score

["confidence", "high"] // Confidence level

],

content: JSON.stringify({

claims: [

// Claim objects as defined above

]

}),

sig: "hex string"  // Signature

}

```

  

## 3. Technical Implementation Notes

  

### 3.1 Nostr Protocol Integration

  

#### 3.1.1 Connecting to Nostr Relays

For connecting to and monitoring Nostr relays:

1. Establish WebSocket connections to multiple relays

2. Implement the Nostr client protocol (NIP-01)

3. Subscribe to relevant event kinds (primarily kind 1 - text notes)

4. Handle connection errors and reconnection logic

  

#### 3.1.2 Publishing to Nostr

For publishing credibility scores back to the network:

1. Create custom events using kind 39000 (application-specific range)

2. Include references to the original events using tags

3. Sign the events with the oracle's private key

4. Publish to multiple relays for redundancy

  

#### 3.1.3 Relevant Nostr Implementation Proposals (NIPs)

1. **NIP-01**: Basic protocol flow and event format

2. **NIP-02**: Contact list and petnames

3. **NIP-09**: Event deletion

4. **NIP-16**: Event treatment

5. **NIP-20**: Command results

  

### 3.2 Claim Extraction Strategy

  

The initial MVP will use pattern matching to extract factual claims:

1. Focus on statements with specific patterns like "X is Y", "X happened", etc.

2. Look for indicators of factual claims (dates, numbers, named entities)

3. Filter out opinions and subjective content

4. Prioritize claims that are concrete and verifiable

  

### 3.3 NewsAPI Integration

  

The verification process via NewsAPI will include:

1. Constructing relevant search queries from extracted claims

2. Retrieving and analyzing search results

3. Assessing the credibility of sources

4. Comparing claim content with article content

5. Handling rate limits through caching and request throttling

  

### 3.4 Scoring Algorithm

  

The credibility scoring will consider:

1. Number and quality of sources confirming the claim

2. Recency of the confirming sources

3. Consistency across multiple sources

4. Source reputation and reliability

5. Confidence level of the match between claim and source

  

## 4. Implementation Timeline

  

Given the constraint of a 1-day MVP build:

  

1. **Hours 0-1**: Project setup and configuration

2. **Hours 1-3**: Implement Nostr client and relay connections

3. **Hours 3-5**: Build claim extraction and verification logic

4. **Hours 5-7**: Develop scoring algorithm and API endpoints

5. **Hours 7-8**: Testing, debugging, and documentation

  

## 5. Open Questions

  

1. **Claim Extraction Complexity**: How sophisticated should the initial claim extraction be? Pattern matching may miss nuanced claims or misidentify statements.

  

2. **Scoring Algorithm Details**: What specific factors should be weighted in the scoring algorithm? How should conflicts between sources be resolved?

  

3. **Relay Selection**: Which Nostr relays should be prioritized for monitoring and publishing scores?

  

4. **Rate Limiting Strategy**: How should the system handle NewsAPI rate limits? Should there be a queue system for high-traffic periods?

  

5. **Handling Multilingual Content**: Should the MVP support languages other than English, or should this be deferred to a future version?

  

6. **Privacy Considerations**: Should the system anonymize any data when storing or publishing verification results?

  

7. **Dispute Resolution**: Should there be a mechanism for users to challenge or appeal verification results?

  

## 6. Future Enhancements (Post-MVP)

  

1. **Lightning Integration**: Implement NIP-57 zaps for rewarding quality content

2. **Advanced AI**: Integrate OpenAI/LLM for better claim extraction

3. **Smart Widget**: Develop YakiHonne integration for client-side display

4. **User Reputation**: Track and score content creators over time

5. **Database**: Implement persistent storage with PostgreSQL

6. **Web Interface**: Create a React dashboard for monitoring scores

  

## 7. Conclusion

  

The NostrOracle MVP provides a foundation for content verification in the Nostr ecosystem. By focusing on the core functionality of claim extraction, verification against news sources, and publishing credibility scores, the system offers immediate value while setting the stage for more advanced features in future versions.

  

The 1-day build scope is ambitious but achievable by leveraging existing libraries and focusing on the essential components. The modular architecture allows for future expansion and enhancement as the project evolves beyond the MVP phase.