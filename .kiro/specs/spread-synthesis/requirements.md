# Requirements Document

## Introduction

The Spread Synthesis feature integrates the Pollinations.ai text generation API into the Sophia Tarot App to produce personalized AI-generated interpretations of card readings. When a user draws cards, the system uses the fixed card meanings, the user's stated intention, and the combination/order of cards to generate a unique narrative synthesis. The AI acts as a "reader" interpreting how sacred card meanings apply to the seeker's specific question and moment. This feature adds a new layer of personalization without modifying the existing card content, export pipeline, or visual design.

## Glossary

- **Synthesis_Service**: The client-side module responsible for constructing prompts and calling the Pollinations.ai text generation API to produce personalized interpretations.
- **Pollinations_API**: The Pollinations.ai free-tier text generation endpoint (POST https://gen.pollinations.ai/v1/chat/completions) that accepts OpenAI-compatible chat completion requests without requiring an API key.
- **Single_Draw_Synthesis**: A personalized AI-generated reflection on one card in the context of the seeker's intention.
- **Spread_Synthesis**: A woven AI-generated narrative interpreting how multiple cards in a 5-card spread relate to each other and to the seeker's question.
- **Reading_Object**: The immutable data structure created by readingStore.js that contains card data, seeker information, and intention for a single drawn card.
- **Card_Content**: The fixed, authored fields of a card (title, purpose, meaning, mantra, pillar) that are treated as sacred and immutable.
- **Seeker_Intention**: The free-text intention or question the user provides before drawing cards.
- **JPG_Export_Pipeline**: The existing html2canvas-based system that renders branded reading images; this pipeline remains completely untouched by this feature.

## Requirements

### Requirement 1: Prompt Construction

**User Story:** As a seeker, I want the AI to understand my intention and my drawn cards, so that the synthesis is personally relevant to my question.

#### Acceptance Criteria

1. WHEN a single card is drawn, THE Synthesis_Service SHALL construct a prompt containing the card's title, purpose, meaning, mantra, pillar, and the Seeker_Intention, structured as: system message first, then Card_Content fields, then Seeker_Intention.
2. WHEN a 5-card spread is completed, THE Synthesis_Service SHALL construct a prompt containing all five cards' title, purpose, meaning, mantra, and pillar fields sequenced by draw order (position 1 through position 5), with each card's position explicitly labeled, along with the Seeker_Intention.
3. THE Synthesis_Service SHALL include a system message instructing the AI to act as a tarot reader interpreting fixed card meanings for the seeker's specific question.
4. THE Synthesis_Service SHALL NOT modify, paraphrase, or replace any Card_Content in the prompt construction.
5. IF the Seeker_Intention exceeds 500 characters, THEN THE Synthesis_Service SHALL truncate the intention to 500 characters before including it in the prompt.
6. IF any Card_Content field is empty, THEN THE Synthesis_Service SHALL omit that field from the prompt rather than including a blank entry.

### Requirement 2: Pollinations API Integration

**User Story:** As a developer, I want to integrate the Pollinations.ai free-tier API, so that the app generates personalized readings without requiring API keys or paid services.

#### Acceptance Criteria

1. THE Synthesis_Service SHALL call the Pollinations_API using an HTTP POST request to https://gen.pollinations.ai/v1/chat/completions with a JSON request body containing a "messages" array and a "model" field conforming to the OpenAI chat completions format.
2. THE Synthesis_Service SHALL send requests without an API key or authentication header.
3. THE Synthesis_Service SHALL set the model parameter to "openai" as the text generation model for the Pollinations free tier.
4. WHEN the Pollinations_API returns an HTTP 200 response with a valid JSON body, THE Synthesis_Service SHALL extract the generated text from the first choice's message content field in the response.
5. THE Synthesis_Service SHALL include an HTTP Referer header with the value "sophia-tarot" in every request to the Pollinations_API to qualify for the Pollinations.ai app showcase.
6. THE Synthesis_Service SHALL set the max_tokens parameter to a value between 400 and 800 to constrain response length to the ranges required by single-card and spread synthesis.

### Requirement 3: Single Card Synthesis Generation

**User Story:** As a seeker drawing one card, I want a personalized reflection on that card in the context of my intention, so that the reading feels uniquely relevant to me.

#### Acceptance Criteria

1. WHEN a single card is drawn and the Seeker_Intention is provided, THE Synthesis_Service SHALL generate a personalized reflection connecting the card's meaning to the seeker's question.
2. THE Synthesis_Service SHALL produce a Single_Draw_Synthesis of between 100 and 300 words, as measured by whitespace-delimited token count.
3. THE Synthesis_Service SHALL include tone instructions in the prompt directing the AI to use a reverent, contemplative voice consistent with spiritual guidance.
4. THE Synthesis_Service SHALL reference the specific card's title and at least one element from the card's purpose, meaning, or mantra fields in the generated text.
5. IF the Seeker_Intention is empty or contains only whitespace, THEN THE Synthesis_Service SHALL generate a general reflection on the card's meaning without referencing a specific question.

### Requirement 4: Five-Card Spread Synthesis Generation

**User Story:** As a seeker completing a 5-card spread, I want a woven narrative showing how my cards relate to each other and my question, so that I receive a holistic interpretation.

#### Acceptance Criteria

1. WHEN all five cards in a spread have been drawn and the Seeker_Intention is provided, THE Synthesis_Service SHALL generate a Spread_Synthesis narrative connecting all five cards.
2. THE Synthesis_Service SHALL produce a Spread_Synthesis of between 300 and 600 words, as measured by whitespace-delimited token count.
3. THE Synthesis_Service SHALL reference each card's position in the draw order (position 1 through position 5) and explain how adjacent and non-adjacent cards relate to one another thematically.
4. THE Synthesis_Service SHALL address the seeker's intention directly within the narrative by referencing the Seeker_Intention text.
5. THE Synthesis_Service SHALL include tone instructions in the prompt directing the AI to use a reverent, contemplative voice consistent with spiritual guidance.
6. IF the Seeker_Intention is empty or contains only whitespace, THEN THE Synthesis_Service SHALL generate a general narrative connecting the five cards without referencing a specific question.

### Requirement 5: Automatic Synthesis Trigger

**User Story:** As a seeker, I want the synthesis to appear automatically after I draw my card(s), so that I do not need to take extra steps to receive my personalized reading.

#### Acceptance Criteria

1. WHEN a single card is drawn and the card reveal animation completes, THE Synthesis_Service SHALL initiate the synthesis request automatically without additional user interaction.
2. WHEN the final card of a 5-card spread is drawn and revealed, THE Synthesis_Service SHALL initiate the spread synthesis request automatically without additional user interaction.
3. WHILE the synthesis is being generated, THE system SHALL display a loading indicator with the text "Channeling your reading..." in the synthesis display area.
4. WHEN the synthesis generation completes, THE system SHALL display the synthesis text in the reading view below the existing card content with a fade-in transition.
5. THE Synthesis_Service SHALL NOT block or delay the display of Card_Content while the synthesis request is in progress.

### Requirement 6: Synthesis Display

**User Story:** As a seeker, I want to read my personalized synthesis alongside the fixed card content, so that I can see both the sacred text and my personal interpretation together.

#### Acceptance Criteria

1. THE system SHALL display the synthesis text as a distinct section visually separated from the Card_Content by a visible divider or spacing of at least 24px, and preceded by a heading labelled with a synthesis-identifying title rendered in Cinzel font.
2. THE system SHALL render the synthesis body text using Cormorant Garamond and any synthesis section headings using Cinzel, consistent with the existing app typography.
3. THE system SHALL display the synthesis section below the card's fixed meaning and mantra sections, maintaining the full rendering of all Card_Content above it.
4. THE system SHALL NOT replace, obscure, or reduce the font size, opacity, or allocated space of any existing Card_Content when displaying the synthesis.
5. IF the synthesis text is not yet available, THEN THE system SHALL display a loading indicator in the synthesis section area while preserving all visible Card_Content above it.
6. IF the synthesis generation fails or returns empty, THEN THE system SHALL hide the synthesis section entirely without altering the layout or visibility of the Card_Content.
7. THE system SHALL display synthesis text up to a maximum of 2000 characters, truncating any excess with a visible ellipsis indicator.

### Requirement 7: Error Handling and Graceful Degradation

**User Story:** As a seeker, I want the app to remain fully functional even if the AI service is unavailable, so that I always receive my card reading regardless of network conditions.

#### Acceptance Criteria

1. IF the Pollinations_API returns an HTTP error status, is unreachable, or returns a malformed or empty response body, THEN THE Synthesis_Service SHALL allow the reading to proceed with Card_Content displayed normally.
2. IF the Pollinations_API does not respond within 15 seconds, THEN THE Synthesis_Service SHALL abort the request using an AbortController and display the reading without synthesis.
3. IF synthesis generation fails, THEN THE system SHALL NOT display any error modal, toast, or overlay visible to the user.
4. IF synthesis generation fails, THEN THE system SHALL dismiss any loading indicator that was displayed for the synthesis section.
5. IF synthesis generation fails, THEN THE system SHALL log the failure reason to the browser console for debugging purposes.

### Requirement 8: Export Pipeline Preservation

**User Story:** As a seeker, I want my saved reading images to remain unchanged, so that the beautiful branded JPG exports continue to look exactly as they did before.

#### Acceptance Criteria

1. THE JPG_Export_Pipeline SHALL render exported images using html2canvas with the same configuration parameters (scale, width, backgroundColor, CORS settings) as defined prior to this feature being added.
2. THE JPG_Export_Pipeline SHALL NOT include any synthesis text content in the DOM element passed to html2canvas for rendering.
3. THE JPG_Export_Pipeline SHALL produce images at 900px width with scale 1 for full reading exports using JPEG quality of 0.92.
4. WHEN a user triggers export on a mobile device that supports the Web Share API, THE system SHALL present the native share sheet with the reading image file attached.
5. WHEN a user triggers export on a desktop device or a device without Web Share API support, THE system SHALL initiate a file download of the JPG image.

### Requirement 9: Synthesis Persistence in Reading Object

**User Story:** As a developer, I want synthesis text stored in the reading object, so that it can be displayed in the current session and potentially recalled later.

#### Acceptance Criteria

1. WHEN synthesis generation succeeds, THE system SHALL store the synthesis text as a new "synthesis" string field on the Reading_Object.
2. THE system SHALL NOT modify, remove, or reorder any existing fields of the Reading_Object when adding synthesis data.
3. WHEN synthesis generation fails or is aborted, THE Reading_Object SHALL contain a null value for the synthesis field rather than an error message or undefined.
4. THE Reading_Object SHALL remain immutable (Object.freeze) after the synthesis field is populated.

### Requirement 10: Pollinations App Showcase Compliance

**User Story:** As a product owner, I want the integration to meet Pollinations.ai showcase requirements, so that the app qualifies for listing in their app directory.

#### Acceptance Criteria

1. THE Synthesis_Service SHALL include the app name "sophia-tarot" in requests to the Pollinations_API via the HTTP Referer header.
2. WHEN synthesis text is displayed, THE system SHALL display a "Powered by Pollinations.ai" attribution directly below the synthesis text section.
3. THE attribution SHALL link to https://pollinations.ai and open the link in a new browser tab when tapped or clicked.
4. THE attribution SHALL use the app's gold accent color and a font size no smaller than 12px.
5. IF synthesis generation fails or no synthesis is displayed, THEN THE system SHALL NOT display the Pollinations attribution.
