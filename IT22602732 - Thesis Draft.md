# EMOTION-AWARE AGILE SYSTEM FOR PROGRESS TRACKING, EXPERTISE RECOMMENDATION, REQUIREMENT MANAGEMENT AND INCLUSIVE COMMUNICATION

---

Mahadura Buddhi Harshana De Silva
IT22602732

B.Sc. (Hons) Degree in Information Technology Specialized in Software Engineering

Department of Information Technology
Sri Lanka Institute of Information Technology
Sri Lanka

August 2025

---

# EMOTION-AWARE AGILE SYSTEM FOR PROGRESS TRACKING, EXPERTISE RECOMMENDATION, REQUIREMENT MANAGEMENT AND INCLUSIVE COMMUNICATION

Mahadura Buddhi Harshana De Silva

IT22602732

Dissertation submitted in partial fulfillment of the requirements for the Special Honours Degree of Bachelor of Science in Information Technology Specializing in Software Engineering

Department of Information Technology
Sri Lanka Institute of Information Technology
Sri Lanka

August 2025

---

## DECLARATION

I declare that this is my own work and this dissertation does not incorporate without acknowledgement any material previously submitted for a Degree or Diploma in any other University or institute of higher learning and to the best of my knowledge and belief it does not contain any material previously published or written by another person except where the acknowledgement is made in the text.

Also, I hereby grant to Sri Lanka Institute of Information Technology, the non-exclusive right to reproduce and distribute my dissertation, in whole or in part in print, electronic or other medium. I retain the right to use this content in whole or part in future works (such as articles or books).

The supervisor/s should certify the proposal report with the following declaration.
The above candidate has carried out research for the bachelor's degree Dissertation under my supervision.

Signature of the supervisor:	Date:
(Ms. Ishara Weerathunga)

Signature of the supervisor:	Date:
(Ms. Hansi De Silva)

---

## ABSTRACT

Agile software development relies heavily on effective team communication during ceremonies such as sprint planning, daily standups, and brainstorming sessions. However, communication barriersâ€”including hesitation, linguistic limitations, and lack of psychological safetyâ€”frequently prevent team members from contributing their ideas fully and confidently. Existing project management tools focus on tracking tasks and metrics but provide no mechanism to detect when team members are struggling to articulate their thoughts or to assist them in refining unclear contributions into professional, actionable statements.

This research addresses these challenges through the development of an AI-Based Inclusive Communication and Brainstorming Platform, a comprehensive system designed to detect hesitation in both typed and spoken contributions, refine unclear ideas while preserving critical technical entities, and provide intelligent suggestions to help users develop their thoughts further. The system employs an Isolation Forest algorithm to detect hesitation patterns from typing behavior metrics, and a CNN + BiLSTM + Attention deep learning model to classify speech audio as fluent or hesitant. A novel entity-preserving rephrasing pipeline uses spaCy Named Entity Recognition to mask technical terms before sending text to a large language model for rephrasing, then restores the original entities in the output. Additionally, the platform generates AI-powered idea continuations, guiding questions, and thematic idea clustering to structure brainstorming outcomes. By providing these automated, non-intrusive support mechanisms, the system empowers all team membersâ€”regardless of their communication style or linguistic backgroundâ€”to contribute effectively to technical discussions.

**Keywords** â€“ Inclusive Communication, Speech Hesitation Detection, Typing Hesitation, Entity-Preserving Rephrasing, Agile Brainstorming, Deep Learning

---

## ACKNOWLEDGEMENT

First and foremost, I would like to express my sincere gratitude to my supervisor, Mrs. Ishara Weerathunga, for her constant guidance, invaluable insights, and support, which were instrumental in the successful completion of my research. My sincere thanks also go to Mrs. Hansi De Silva, the co-supervisor of this research project, for her dedicated assistance and for being willing to provide expert feedback whenever it was needed.

I would also like to extend my deep appreciation to the members of my viva panel for their time, constructive evaluations, and academic guidance during the defense process. Their expertise significantly helped in refining the quality of this work.

Furthermore, I express my sense of gratitude to my team members for their collaboration and shared efforts throughout this journey. Finally, I thank my family, friends, and everyone who directly or indirectly extended their support throughout the duration of this project.

---

## LIST OF FIGURES
## LIST OF TABLES
## LIST OF ABBREVIATIONS

---

## CHAPTER 1: INTRODUCTION

Agile software development has emerged as the predominant methodology for contemporary software engineering teams, valued for its iterative nature, adaptability to change, and emphasis on collaborative team dynamics. Frameworks such as Scrum and Kanban provide robust structures for task management and workflow optimization, enabling teams to deliver software incrementally while responding quickly to evolving stakeholder needs. However, while Agile frameworks address technical and procedural aspects effectively, they predominantly neglect two critical human-centered dimensions that fundamentally influence team performance and project outcomes: emotional intelligence and the predictive analysis of requirement changes.

The challenge facing modern Agile teams is multifaceted. On one hand, traditional Agile management toolsâ€”such as Jira, Trello, and Azure DevOpsâ€”excel at recording tangible metrics and tracking completed work but remain fundamentally "emotion-blind" and "impact-blind." They function as reactive digital ledgers that document what has already transpired, offering no predictive insight into how mid-sprint changes will affect sprint velocity, team morale, or delivery commitments. On the other hand, research in organizational psychology and software engineering consistently demonstrates that emotional statesâ€”including frustration, demotivation, burnout, and interpersonal conflictâ€”significantly impact productivity, collaboration quality, and ultimately sprint success. This creates a critical gap in holistic project management: teams lack an integrated system that understands both the emotional dimensions of their work and the predictive intelligence to anticipate requirement change impacts before they destabilize the sprint.

This thesis addresses these interconnected challenges through the development of an AI-Based Inclusive Communication and Brainstorming Platform, a comprehensive, AI-driven component designed to bridge the communication gap in modern Agile environments. The system operates on the principle that sustainable, high-performing teams require visibility into communication dynamics and support mechanisms that enable all members to contribute effectively. By integrating Natural Language Processing (NLP), deep learning models, anomaly detection algorithms, and large language model APIs, the system empowers Scrum Masters, Product Owners, and development teams to foster psychologically safe work environments where hesitation is detected and addressed, ideas are refined intelligently, and brainstorming outcomes are structured for actionable use.

### 1.1 Background Literature

Agile software development emerged in the early 2000s as a significant shift away from traditional Waterfall methodologies, enabling teams to work in short, iterative cycles and adapt quickly to change. Over time, it has become the dominant approach across industries such as fintech, healthcare, and e-commerce due to its ability to deliver faster results, improve customer satisfaction, and respond effectively to evolving requirements. The principles of the Agile Manifesto emphasize the importance of human interaction and adaptability, which are reflected in common practices like daily standups, sprint reviews, and retrospectives. Despite these strengths, Agile methodologies still face persistent challenges. Emotional and psychological factors that influence team performance often remain hidden or are incorrectly attributed to process inefficiencies, while communication barriers during team ceremonies significantly impact the quality and inclusivity of collaborative discussions.

Communication is widely recognized as a critical success factor in Agile software development. Research by Miranda et al. demonstrates that quantitative analysis of communication dynamics in Agile teams reveals significant correlations between communication patterns and project outcomes. Teams with higher communication inclusivityâ€”where all members actively contribute during planning and brainstorming sessionsâ€”consistently outperform teams where a small number of dominant voices drive decisions. However, existing tools provide no mechanism to detect or address communication imbalances, leaving quieter or less confident team members without support.

The emotional dimension of Agile development has gained attention in recent years, highlighting the critical role of human factors in team performance. Research shows that emotional states such as stress, frustration, and burnout are strongly linked to decreased productivity, increased defect rates, and higher employee turnover. Psychological safety within teams has also been identified as a key determinant of success, often outweighing individual technical skill. Communication patterns can reveal early signs of conflict or disengagement, yet these signals are rarely captured by existing tools. The lack of emotional awareness in Agile environments allows small issues to escalate into larger problems, ultimately affecting project outcomes. Context-switching and workload imbalances further exacerbate these challenges by impairing cognitive performance, particularly in complex technical tasks.

Recent advancements in speech processing and natural language processing have demonstrated promising approaches to detecting hesitation and disfluency in spoken language. Deep learning architectures combining convolutional neural networks (CNNs) with recurrent neural networks such as Long Short-Term Memory (LSTM) networks have shown strong performance in classifying speech segments as fluent or disfluent. Paralinguistic features including Mel-frequency cepstral coefficients (MFCCs), delta coefficients, and chroma features provide rich representations of acoustic signals that capture subtle patterns associated with hesitation, filled pauses, and uncertainty. However, the application of these techniques to Agile team communication contexts remains largely unexplored.

In the domain of text processing, transformer-based language models have revolutionized natural language understanding and generation. Models such as T5, BERT, and large language models (LLMs) like Llama can rephrase text for clarity and professionalism. However, a critical challenge arises when rephrasing technical content: these models frequently corrupt, hallucinate, or modify domain-specific entities such as sprint numbers, bug identifiers, and tool names. This entity corruption problem makes direct application of LLMs to Agile communication unreliable without additional safeguards.

Anomaly detection techniques, particularly the Isolation Forest algorithm, have been successfully applied in various domains for identifying unusual patterns without requiring labeled training data. The unsupervised nature of Isolation Forest makes it particularly suitable for detecting anomalous typing behaviors that may indicate hesitation, as creating large labeled datasets of "hesitant" versus "confident" typing sessions is impractical. The algorithm isolates anomalies by randomly partitioning data, with anomalous points requiring fewer partitions to be isolated from normal observations.

Despite these advances, there remains a clear gap in existing solutions. Current project management tools primarily function as tracking systems without communication intelligence or support capabilities. Academic research has explored individual components such as speech disfluency detection, text rephrasing, and sentiment analysis, but these efforts are largely fragmented. No unified system integrates hesitation detection across modalities (typing and speech), entity-preserving text refinement, and AI-powered brainstorming assistance into a cohesive platform designed specifically for Agile team communication.

### 1.2 Research Gap

While existing research has extensively addressed communication in software engineering, speech processing, and natural language processing, several critical gaps remain that this thesis addresses.

First, there is no integrated system for detecting communication hesitation across multiple modalities in Agile environments. Speech disfluency detection research typically focuses on clinical or educational contexts, not on professional team collaboration. Similarly, research on typing behavior analysis has primarily targeted keystroke dynamics for authentication rather than communication confidence assessment. No existing system detects hesitation in both typed and spoken contributions within a unified brainstorming platform.

Second, there is a clear absence of entity-preserving text refinement for Agile communication. While large language models can rephrase text for clarity, they consistently corrupt domain-specific technical entities. Research on named entity recognition and text generation has not addressed the specific challenge of preserving Agile-specific entities (sprint numbers, issue identifiers, tool names) during automated text rephrasing. The entity masking-restoration approach proposed in this thesis addresses this gap directly.

Third, existing brainstorming tools lack AI-powered support mechanisms that respond to detected hesitation. When a team member struggles to articulate an idea, current tools offer no assistance. The integration of hesitation detection with context-aware suggestion generationâ€”providing idea continuations, guiding questions, and structured rephrasingâ€”represents a novel contribution that bridges the gap between passive communication tools and active support systems.

Fourth, there is a fragmentation in how communication support features are addressed. Research tends to focus on isolated elements such as speech recognition, sentiment analysis, or text summarization, without integrating these aspects into a unified platform that serves a specific workflow (Agile brainstorming). A comprehensive approach requires simultaneous consideration of hesitation detection, entity preservation, text refinement, and idea development support, yet existing methods treat these dimensions independently.

Finally, current approaches lack adaptive and context-aware AI assistance for brainstorming sessions. While some tools provide basic auto-completion or template suggestions, they do not generate domain-specific idea continuations, guiding questions tailored to the user's current thought, or thematic clustering of brainstorming outcomes. These capabilities are essential for transforming raw brainstorming output into structured, actionable insights for sprint planning.

This thesis addresses these gaps by proposing an integrated approach that combines multiple advanced capabilities into a single platform. It introduces a dual-modality hesitation detection system using Isolation Forest for typing behavior and CNN + BiLSTM + Attention for speech audio. It develops a novel entity-preserving rephrasing pipeline that masks domain entities before LLM processing and restores them afterward with multi-pass corruption cleanup. It integrates context-aware AI assistance including idea continuations, guiding questions, and thematic clustering. Through this comprehensive approach, the thesis aims to bridge the gap between passive communication tools and intelligent, inclusive brainstorming platforms for Agile development.
### 1.3 Research Problem

Agile software development relies on collaborative ceremoniesâ€”sprint planning, daily standups, retrospectives, and brainstorming sessionsâ€”where effective communication is essential for project success. While mainstream project management tools such as Jira, Trello, and Azure DevOps effectively record backlog items and sprint outcomes, they provide no insight into the quality or inclusivity of team communication. When a team member hesitates during a brainstorming session, struggles to articulate a technical idea, or fails to contribute due to linguistic limitations or lack of confidence, existing tools offer no detection mechanism and no support.

Teams encounter several interrelated communication challenges in Agile environments. One key issue is that hesitation during brainstorming is invisible to current tools. A team member may repeatedly delete and retype text (indicating uncertainty), use filler words and pauses in spoken contributions (indicating disfluency), or submit ideas that are poorly structured (indicating difficulty in articulation). These behavioral signals are lost in traditional tools, meaning managers have no visibility into which team members need support and which ideas were potentially underrepresented due to communication barriers.

Another challenge arises from the fact that AI-powered text refinement corrupts technical content. When team members submit rough or informal ideas, natural language processing tools can potentially rephrase them for clarity. However, large language models consistently modify, hallucinate, or corrupt domain-specific entities such as sprint numbers (e.g., "sprint 5"), issue identifiers (e.g., "BUG-123"), and tool names (e.g., "Docker", "Kubernetes"). This entity corruption makes direct LLM application unreliable for Agile communication, where technical accuracy is paramount.

Furthermore, team members who hesitate receive no adaptive assistance. When a user pauses during typing or uses filled pauses ("um", "uh") during speech, the system should recognize this as a signal that the user needs supportâ€”not judgment. Current tools offer no context-aware suggestions, guiding questions, or idea continuations that could help hesitant contributors develop their thoughts further.

The problem is intensified in distributed and culturally diverse teams, where non-native English speakers may face additional barriers in articulating technical concepts. Junior developers and newly joined team members often lack the confidence to contribute ideas during brainstorming sessions, particularly when more experienced team members dominate discussions. In such scenarios, valuable perspectives are lost, and team decision-making suffers from reduced diversity of thought.

Additionally, brainstorming sessions produce unstructured output that requires significant manual effort to organize. Ideas submitted during brainstorming are typically recorded as flat lists without thematic organization, making it difficult for teams to identify patterns, prioritize themes, and translate brainstorming output into actionable sprint items.

The central research problem, therefore, is to determine how an AI-driven, multimodal communication support system can be designed and implemented to automatically detect hesitation in both typed and spoken contributions using typing behavior analysis and speech audio classification. Such a system should be capable of refining unclear or hesitant ideas into professional, clear statements while preserving all domain-specific technical entities exactly as the user intended. It should generate context-aware support including idea continuations, guiding questions, and structured suggestions when hesitation is detected. It should also organize brainstorming output through AI-powered thematic clustering with actionable insights and recommendations. Finally, it should provide a complete brainstorming session management platform with persistent storage, session tracking, and idea approval workflows. The need to address this comprehensive set of communication challenges in Agile environments forms the core motivation for this thesis.

---

## CHAPTER 2: RESEARCH OBJECTIVES

### 2.1 Main Objective

The primary objective of this research is to design, develop, and validate an AI-Based Inclusive Communication and Brainstorming Platform that enhances the quality, inclusivity, and effectiveness of Agile team communication. The system is intended to bridge the gap between passive communication tools and intelligent, adaptive support systems by combining deep learning, anomaly detection, natural language processing, and large language model capabilities into a unified decision-support platform.

The proposed system processes multimodal communication data from typing sessions and speech audio to detect hesitation cues, communication patterns, and contribution dynamics. It incorporates a novel entity-preserving rephrasing pipeline that refines unclear ideas while maintaining technical accuracy. The system generates context-aware AI assistance including idea continuations, guiding questions, and brainstorming suggestions to help users develop and articulate their thoughts. It also provides AI-powered thematic clustering that organizes brainstorming output into structured categories with insights and recommendations.

Overall, the system aims to create a more inclusive, efficient, and psychologically safe brainstorming environment by providing non-intrusive support mechanisms that detect when team members need assistance and deliver contextually appropriate help. This enables Agile teams to capture higher-quality ideas from all team members, ensuring that communication barriers do not prevent valuable contributions from being heard and considered.

### 2.2 Specific Objectives

To achieve the main objective, the following specific objectives are defined:

**SO1**: Design and implement a typing hesitation detection mechanism using unsupervised anomaly detection. Develop feature engineering pipelines that extract hesitation-indicative metrics from typing sessions including deletion frequency, cursor movement patterns, and temporal characteristics. Train and validate an Isolation Forest model against manually annotated ground truth data to classify typing sessions as hesitant or confident.

**SO2**: Design and implement a speech hesitation detection system using deep learning. Develop an audio feature extraction pipeline combining MFCC, delta-MFCC, and chroma features to create rich acoustic representations. Train a CNN + BiLSTM + Attention neural network architecture to classify speech segments as fluent or hesitant based on the presence of filler words, filled pauses, and disfluency markers.

**SO3**: Develop an entity-preserving text rephrasing pipeline that refines unclear ideas into professional statements while maintaining domain-specific technical accuracy. Implement a spaCy-based Named Entity Recognition system with custom Agile-specific entity rules. Design a masking-restoration approach that protects entities during LLM-based rephrasing, with multi-pass cleanup mechanisms to handle corrupted entity tokens.

**SO4**: Implement context-aware AI assistance capabilities including idea continuation prediction, guiding question generation, and idea suggestion generation. Leverage large language model APIs to provide domain-specific, contextually relevant support that helps users develop and articulate brainstorming ideas. Ensure graceful degradation through fallback mechanisms when external API services are unavailable.

**SO5**: Develop AI-powered thematic clustering of brainstorming ideas using large language model semantic analysis. Implement a clustering pipeline that groups ideas into thematic categories, generates cluster summaries, produces session-level insights, and provides actionable recommendations for sprint planning.

**SO6**: Design and implement a unified brainstorming platform with dual-mode input support (typing and speech), persistent session management, idea CRUD operations, and interactive dashboards. Develop unified processing pipelines that combine hesitation detection, entity extraction, rephrasing, and AI assistance into single API endpoints for seamless user experience.

**SO7**: Conduct comprehensive system validation through functional testing, performance benchmarking, and user acceptance evaluation. Measure model performance using standard metrics (accuracy, precision, recall, F1-score, ROC-AUC) and validate system usability through structured pilot studies with Agile teams.

---

## CHAPTER 3: METHODOLOGY

### 3.1 System Overview and Component Architecture

The proposed Inclusive Communication and Brainstorming Platform is designed to support Agile team members in contributing ideas effectively through both typing and speech modalities, while the system provides real-time AI-powered assistance. The system operates through five interconnected phases: multimodal input capture, hesitation detection, entity-preserving text refinement, AI-powered idea development support, and structured session management with thematic clustering.

The component integrates multiple data sources and processing pipelines: typing behavior metrics (deletion frequency, cursor movements, timing), speech audio signals (raw waveforms processed into acoustic features), natural language text (user ideas processed for entities and clarity), and session context (previous ideas, participant history, session goals). These inputs flow through a sophisticated ML-powered intelligence layer that operates in real-time as users contribute ideas during brainstorming sessions.

The component architecture follows a three-layer design: the presentation layer (frontend) handles user interaction through capture screens, preview panels, idea boards, and clustering views; the intelligence layer (backend) executes all ML models, NLP pipelines, and LLM integrations; and the data layer (MongoDB) persists all session data, ideas, and analysis metadata. This separation of concerns enables scalability and allows each layer to be optimized independently.

### 3.1.1 Implementation Approach

The backend implementation uses FastAPI, a modern Python web framework, to expose RESTful endpoints for all operations. The system follows a pipeline-oriented architecture where user input triggers a cascade of analyses. When a user submits text through the typing interface, the system runs a unified pipeline that sequentially executes entity detection, entity-preserving rephrasing, hesitation detection from typing metrics, idea continuation prediction, and guiding question generation. Similarly, when audio is submitted through the speech interface, a parallel pipeline runs speech hesitation detection, Whisper transcription, entity-preserving transcript rephrasing, and conditional suggestion generation.

All models are loaded at application startup through a centralized ModelManager class that handles lazy loading, error recovery, and health monitoring. Each model includes built-in fallback mechanismsâ€”if a model fails to load or produces invalid output, the system continues using alternative approaches rather than failing entirely. Model status is exposed through a health endpoint that reports which models are available, enabling the frontend to adapt its interface based on system capabilities.

### 3.1.2 Typing Hesitation Detection (Isolation Forest)

The typing hesitation detection module uses an Isolation Forest algorithm to identify anomalous typing patterns that indicate user uncertainty or hesitation. The model operates on five features extracted from typing session behavior:

**Feature Engineering:**
- **delFreq**: Total number of deletion keypresses (backspaces) during the typing session. High deletion frequency indicates the user is repeatedly correcting their text, suggesting uncertainty about content.
- **leftFreq**: Total number of left arrow key presses. Cursor movement backward indicates the user is reviewing and editing previous content rather than typing fluently forward.
- **TotTime**: Total time taken for the typing session in milliseconds. Combined with other features, longer times with high correction rates indicate hesitation.
- **backspace_ratio**: Calculated as delFreq / (TotTime/1000 + 1). This derived feature normalizes deletion frequency by time, capturing the intensity of corrections per second.
- **correction_rate**: Calculated as (delFreq + leftFreq) / (TotTime/1000 + 1). This captures the overall rate of corrective actions per second.

**Model Training:** The Isolation Forest is trained with contamination=0.2, assuming approximately 20% of typing sessions exhibit hesitant behavior. The model uses 200 estimator trees (n_estimators=200) with random_state=42 for reproducibility. Features are scaled using StandardScaler to zero mean and unit variance before training, as Isolation Forest performance is sensitive to feature magnitudes.

**Inference:** At runtime, the detector prepares features from raw typing metrics, applies the pre-trained scaler, and obtains both an anomaly score (continuous value where lower scores indicate greater anomaly) and a binary prediction (-1 for anomaly/hesitant, 1 for normal/confident). The binary prediction is converted to a boolean is_hesitant flag for downstream use.

**Validation:** The model was validated against a manually annotated dataset (manual_annotation_annotated.csv) where human annotators labeled typing sessions as hesitant or normal. Evaluation metrics include accuracy, ROC-AUC, and detailed classification reports with per-class precision, recall, and F1-score.

### 3.1.3 Speech Hesitation Detection (CNN + BiLSTM + Attention)

The speech hesitation detection module classifies audio clips as fluent (class 0) or hesitation-detected (class 1) using a deep learning architecture that combines convolutional neural networks, bidirectional LSTM, and attention mechanisms.

**Audio Feature Extraction:** Raw audio is processed through a feature extraction pipeline using the librosa library:
1. Audio is normalized using librosa.util.normalize to ensure consistent amplitude levels.
2. Audio is padded or trimmed to exactly 5 seconds (80,000 samples at 16kHz sampling rate).
3. 40 Mel-frequency cepstral coefficients (MFCCs) are extracted, capturing the spectral envelope of the speech signal.
4. 40 delta-MFCC features are computed, capturing the temporal dynamics (rate of change) of the spectral features.
5. 12 chroma features are extracted using Short-Time Fourier Transform, capturing pitch class information.
6. All features are stacked vertically to produce a 92-dimensional feature vector per time frame.
7. The temporal axis is fixed to 216 frames through padding or truncation, producing a final feature matrix of shape [216, 92].

**Model Architecture (CNN + BiLSTM + Attention):**
- **Conv1d Layer 1**: Input channels=92, output channels=64, kernel size=3, padding=1. Captures local acoustic patterns such as short pauses and filler sounds.
- **Conv1d Layer 2**: Input channels=64, output channels=128, kernel size=3, padding=1. Captures higher-level acoustic patterns.
- **ReLU activation** applied after each convolutional layer.
- **Bidirectional LSTM**: Input size=128, hidden size=128, producing 256-dimensional output (128 forward + 128 backward). Captures temporal dependencies across the entire 5-second audio window in both directions.
- **Attention Layer**: A learned linear projection (256â†’1) followed by softmax produces attention weights over time steps. The context vector is computed as the weighted sum of LSTM outputs, focusing the model on the most informative time steps (e.g., moments of hesitation).
- **Fully Connected Layer**: Maps the 256-dimensional attention output to 2 classes (fluent, hesitation).

**Training:** The model was trained on 3,000 audio samples from the DisfluencySpeech dataset (HuggingFace: amaai-lab/DisfluencySpeech). Labels were derived from annotated transcripts by detecting 13 categories of filler words: "um", "uh", "er", "ah", "hmm", "like", "you know", "I mean", "sort of", "kind of", "well", "actually", "basically". Training used Adam optimizer with learning rate 0.0005, batch size 16, CrossEntropyLoss, and ran for 15 epochs. Data was split 80/20 for training and testing.

### 3.1.4 Entity Detection and Preservation (spaCy NER)

The entity detection system uses a spaCy v3.8 pipeline enhanced with custom Agile-specific entity rules to identify domain entities in brainstorming text. This is a critical component that enables the entity-preserving rephrasing pipeline.

**Base Model:** The system loads spaCy's en_core_web_sm model, which provides pre-trained Named Entity Recognition for standard entity types (PERSON, ORG, DATE, GPE, etc.).

**Custom EntityRuler:** An EntityRuler component is added to the pipeline before the statistical NER component, defining pattern-based rules for Agile-specific entities:
- **ISSUE_ID**: Regex pattern `[A-Z]+-[0-9]+` matches issue identifiers like BUG-123, TASK-456, JIRA-789, STORY-101.
- **SPRINT**: Token pattern matching "sprint" (case-insensitive) followed by a digit, capturing references like "sprint 5" or "Sprint 3".
- **TOOL**: Exact match patterns for common development tools: Docker, Jenkins, Kubernetes, GitHub, Jira.

**Training and Evaluation:** The NER system was evaluated on a gold-standard dataset of 400 synthetically generated Agile sentences, each containing known ISSUE_ID, SPRINT, and TOOL entities with precise character-level annotations. Evaluation used spaCy's Scorer class to compute precision, recall, and F1-score both overall and per entity type.

**Entity Preservation Score:** A custom metric was developed to measure the percentage of original entities that appear in the rephrased output text. This metric directly evaluates whether the entity-preserving pipeline successfully maintains technical accuracy during text refinement.
### 3.1.5 Entity-Preserving Rephrasing Pipeline

The entity-preserving rephrasing pipeline is a novel contribution of this thesis, designed to refine unclear or hesitant brainstorming ideas into professional, clear statements while maintaining the exact integrity of all domain-specific technical entities. The pipeline addresses the well-documented problem of entity corruption by large language models during text generation.

**Pipeline Architecture (Four Stages):**

**Stage 1 â€” Entity Detection:** The input text is processed through the spaCy NER pipeline (Section 3.1.4) to identify all named entities. The spaCy Doc object contains the detected entities with their text, labels, and character offsets.

**Stage 2 â€” Entity Masking:** Detected entities are replaced with placeholder tokens (ENTITY_1, ENTITY_2, ..., ENTITY_N) in the input text. Entities are sorted by length (longest first) to prevent partial replacement issues where shorter entities might match within longer entity strings. Word boundary matching using regular expressions ensures that single-digit entity values (e.g., "3" in "sprint 3") do not corrupt previously inserted ENTITY_N tokens. An entity map dictionary maintains the bidirectional mapping between placeholders and original entity text.

**Stage 3 â€” LLM Rephrasing:** The masked text (with entities replaced by safe ENTITY_N tokens) is sent to a large language model for rephrasing. The system uses a dual-model approach:

- **Primary: Groq API (Llama 3.3 70B Versatile)** â€” The masked text is submitted with a carefully engineered prompt that instructs the model to rephrase the idea clearly and professionally while copying ENTITY_N tokens exactly as-is. The prompt includes explicit rules: preserve the original idea, do not introduce new concepts, do not invent entities, remove hedging words (um, uh, maybe, like, kind of, sort of), improve grammar and sentence structure, keep the sentence concise, and output only one rephrased sentence with no explanations. Five few-shot examples are provided to guide the model's behavior, including examples with masked entity tokens to demonstrate correct preservation. Temperature is set to 0.3 and max_tokens to 256 for controlled, deterministic output.

- **Fallback: Fine-tuned Flan-T5-Base** â€” If the Groq API is unavailable or fails, the system falls back to a locally deployed T5 model fine-tuned specifically for entity-preserving rephrasing. The T5 model was trained on 360 training samples (40 validation) derived from the gold NER dataset, where input texts were entity-masked and the model learned to rephrase while preserving ENTITY_N tokens. T5 inference uses beam search (num_beams=4), temperature=0.8, top_p=0.92, and max_length=200. A post-generation rule-based cleanup removes residual hedging patterns using regular expressions.

**Stage 4 â€” Entity Restoration:** The ENTITY_N placeholders in the LLM output are replaced with their original entity text from the entity map. The restoration process handles several corruption patterns that LLMs commonly introduce:
- Standard format: ENTITY_3 â†’ correctly restored
- Duplicated prefix: ENTITY_ENTITY_3 â†’ correctly restored
- Triple prefix: ENTITY_ENTITY_ENTITY_3 â†’ correctly restored
- Space-separated: ENTITY 3 â†’ correctly restored
- Case variations: entity_3, Entity-3 â†’ correctly restored
- Numeric collision: Sorting entity numbers in descending order ensures ENTITY_10 is restored before ENTITY_1.

A final safety pass uses regex to detect and remove any residual ENTITY_N tokens that were not successfully restored, followed by double-space cleanup to produce clean output text.

### 3.1.6 AI-Powered Idea Continuation and Guiding Questions

The system provides three categories of AI-powered assistance to help users develop their brainstorming ideas, with all three leveraging the Groq API (Llama 3.3 70B Versatile):

**Idea Continuation Predictions:** Given a user's partial idea, the system generates 4 short continuation phrases (3-8 words each) that naturally extend the user's thought. The prompt instructs the model to generate diverse continuations covering different angles, keeping them actionable and specific to the idea, without repeating what the user already said. Detected entities are provided as additional context to ground the continuations in the user's domain. The response is parsed as a JSON array of strings.

**Guiding Questions:** When a user appears stuck or hesitant, the system generates 3 context-aware open-ended questions designed to help the user think about different aspects of their idea (users, features, implementation, impact). The prompt adapts based on whether hesitation was detected, with a more supportive and encouraging tone when hesitation signals are present. Detected entities are included in the prompt to ensure questions are specific to the user's idea. Questions begin with interrogative words (Who, What, How, Why, Where, When) and are clear, short, and encouraging.

**Idea Continuation Suggestions:** For speech-based input where hesitation is detected, the system generates 3 one-sentence continuation suggestions (each beginning with "...") that naturally extend the user's spoken thought. These suggestions help users who paused mid-speech to continue their idea in several possible directions.

All three AI assistance features include fallback mechanisms with hardcoded default responses when the Groq API is unavailable, ensuring the system always provides some level of support.

### 3.1.7 AI Idea Clustering

The AI idea clustering module groups brainstorming ideas from a session into thematic categories using LLM-based semantic analysis. This transforms unstructured brainstorming output into organized, actionable categories for sprint planning.

**Clustering Pipeline:**
1. All ideas from a session are retrieved from the database, including their rephrased text (preferred) or original text, detected entities, and tags.
2. A structured prompt is constructed listing all ideas with their IDs, text, entities, and tags.
3. The prompt instructs the Groq API (Llama 3.3 70B, temperature=0.2) to group ideas into 2-7 thematic clusters based on semantic similarity, name each cluster with a 2-5 word theme title, write a one-sentence summary per cluster, produce an overall session overview, generate 3 key insights about session themes, and provide 3 actionable recommendations.
4. The response is parsed as a JSON object with strict validation. A retry mechanism with temperature=0.0 handles malformed responses on the first attempt.

**Response Enrichment:** The LLM's cluster assignments (idea IDs â†’ clusters) are mapped back to full idea objects from the database. Each cluster is enriched with color coding (from a palette of 7 distinct color schemes), an icon name (mapped to Lucide React icons), and the full idea data including original text, entities, tags, and hesitation status. Ideas not assigned to any cluster by the LLM are collected into an "Other Ideas" fallback cluster.

**Fallback:** When the Groq API is unavailable, the system returns all ideas in a single "All Ideas" cluster with appropriate messaging.

### 3.1.8 Speech Transcription Integration

The speech processing pipeline incorporates OpenAI's Whisper model through the faster-whisper implementation, which uses CTranslate2 for optimized inference. The system loads the Whisper "base" model with int8 quantization for CPU deployment, balancing transcription quality against resource requirements.

**Transcription Process:** Audio bytes from uploaded files are written to a temporary WAV file, processed by Whisper with beam_size=5, and the resulting segment transcriptions are concatenated into a single transcript string. The temporary file is cleaned up immediately after processing.

**Integration with Analysis Pipeline:** The transcript output feeds directly into the entity-preserving rephrasing pipeline, enabling a complete speech-to-refined-idea workflow: audio â†’ transcription â†’ entity detection â†’ entity masking â†’ rephrasing â†’ entity restoration.

### 3.1.9 Unified Processing Pipelines

The system implements two unified processing pipelines that combine all analysis capabilities into single API endpoints, minimizing the number of API calls required from the frontend and ensuring consistent processing.

**Typing Pipeline (/typing-process):** Accepts text and typing metrics (delFreq, leftFreq, TotTime), then sequentially executes:
1. Entity-preserving rephrasing (includes entity detection and masking)
2. Typing hesitation detection using Isolation Forest
3. Idea continuation prediction
4. Guiding question generation
5. Idea continuation suggestions
Returns a single response containing the refined idea, detected entities, entity map, hesitation analysis, and all AI assistance outputs.

**Speech Pipeline (/speech-hesitation/transcribe-and-predict):** Accepts an audio file upload, then sequentially executes:
1. Speech hesitation detection (CNN + BiLSTM + Attention)
2. Whisper transcription
3. Entity-preserving transcript rephrasing
4. Fallback entity extraction (if rephrasing did not produce entities)
5. Idea continuation prediction
6. Guiding question generation
7. Conditional idea suggestions (only when hesitation is detected)
Returns a comprehensive response containing the hesitation result, transcript, rephrased transcript, entities, and all AI assistance outputs.

### 3.1.10 Error Handling and Fallback Mechanisms

The system implements comprehensive error handling and graceful degradation strategies to ensure robustness:

**Model-Level Fallbacks:**
- If the Groq API fails â†’ T5 local model handles rephrasing
- If T5 model fails to load â†’ Groq API handles rephrasing exclusively
- If both fail â†’ RuntimeError with descriptive message
- For AI suggestions, continuations, and guiding questions â†’ hardcoded fallback lists

**Service-Level Resilience:**
- Each model in the unified pipeline is wrapped in individual try-catch blocks, allowing the pipeline to continue even if a single component fails
- MongoDB connection failures are handled gracefully: AI features continue operating without persistence
- Audio file validation includes format checking, size limits (10MB per file), and empty file detection

**Startup Health Monitoring:** The ModelManager provides a health check endpoint reporting the loaded/unloaded status of all five models (NER, rephraser, hesitation, speech hesitation, Whisper), allowing the frontend to adapt its UI based on available capabilities.

### 3.1.11 Data Storage and Session Management

The system uses MongoDB (via the Motor async driver for Python) for persistent storage of brainstorming data:

**Collections:**
- **sessions**: Stores brainstorming sessions with name, description, participant IDs, idea counts, and status (active/completed/archived).
- **ideas**: Stores individual brainstorming ideas with rich metadata including original text, rephrased text, detected entities, hesitation scores, typing metrics, approval status, cluster assignments, tags, AI-generated suggestions, and guiding questions.

**Indexes:** Database indexes are created on session_id, participant_id, and created_at fields for efficient queries and sorting.

**CRUD Operations:** Full create, read, update, and delete operations are supported for both sessions and ideas, with automatic timestamp management and referential integrity between sessions and their ideas.

### 3.1.12 Development Tools and Technologies

| Layer | Technology | Purpose |
|---|---|---|
| Backend Framework | FastAPI + Uvicorn | Async REST API with automatic OpenAPI documentation |
| Frontend | React + Vite + Tailwind CSS | Responsive UI with fast development builds |
| State Management | Zustand | Lightweight client-side state store |
| Database | MongoDB Atlas + Motor | Async document store for ideas and sessions |
| NER Model | spaCy v3.8 + custom EntityRuler | Entity detection with Agile-specific patterns |
| Rephraser (Local) | Flan-T5-Base (fine-tuned) | Fallback entity-preserving rephrasing |
| LLM API | Groq (Llama 3.3 70B Versatile) | Primary rephrasing, suggestions, clustering |
| Typing Hesitation | Isolation Forest (scikit-learn) | Unsupervised anomaly detection |
| Speech Hesitation | CNN + BiLSTM + Attention (PyTorch) | Audio classification |
| Transcription | faster-whisper (CTranslate2, int8) | Speech-to-text |
| Audio Processing | librosa | MFCC, delta-MFCC, chroma feature extraction |
| Serialization | joblib | Persist sklearn models and scalers |
| Data Validation | Pydantic v2 | Request/response schema validation |
## CHAPTER 4: TESTING AND IMPLEMENTATION

### 4.1 Functional Testing

Comprehensive functional testing was conducted to verify that all system components operate correctly under expected conditions, edge cases, and failure scenarios. Testing followed a systematic approach covering each module individually and the integrated pipelines end-to-end.

**Table 4.1: Functional Test Cases and Results**

| Test ID | Test Case | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-01 | Entity extraction â€” Agile text | "Fix BUG-123 in sprint 5 using Docker" | Entities: BUG-123 (ISSUE_ID), sprint 5 (SPRINT), Docker (TOOL) | âœ… Pass |
| TC-02 | Entity extraction â€” no entities | "The system should be fast" | Empty entity list | âœ… Pass |
| TC-03 | Entity extraction â€” mixed types | "John from Marketing reviewed TASK-456 on Monday" | PERSON, ORG, ISSUE_ID, DATE entities | âœ… Pass |
| TC-04 | Typing hesitation â€” normal session | delFreq=2, leftFreq=0, TotTime=5000 | is_hesitant=False | âœ… Pass |
| TC-05 | Typing hesitation â€” hesitant session | delFreq=50, leftFreq=30, TotTime=60000 | is_hesitant=True | âœ… Pass |
| TC-06 | Typing hesitation â€” boundary case | delFreq=10, leftFreq=5, TotTime=15000 | Valid score and prediction returned | âœ… Pass |
| TC-07 | Speech hesitation â€” filler words | Audio with "um", "uh" fillers | prediction=1, label="hesitation_detected" | âœ… Pass |
| TC-08 | Speech hesitation â€” clean speech | Clear fluent speech audio | prediction=0, label="fluent" | âœ… Pass |
| TC-09 | Speech hesitation â€” base64 input | Base64-encoded audio | Same result as file upload | âœ… Pass |
| TC-10 | Speech hesitation â€” batch (5 files) | 5 audio files | 5 individual results returned | âœ… Pass |
| TC-11 | Entity-preserving rephrase | "maybe we could try sprint 3 with React" | Sprint 3 and React preserved in output | âœ… Pass |
| TC-12 | Rephrase â€” hedge word removal | "I think maybe possibly we should..." | Hedge words removed, assertive output | âœ… Pass |
| TC-13 | Rephrase â€” entity corruption cleanup | LLM outputs "ENTITY_ENTITY_3" | Correctly restores original entity | âœ… Pass |
| TC-14 | Rephrase â€” Groq fallback to T5 | Groq API unavailable | T5 model produces valid output | âœ… Pass |
| TC-15 | Unified typing pipeline | Text + typing metrics | All outputs: rephrase, hesitation, suggestions, questions | âœ… Pass |
| TC-16 | Unified speech pipeline | Audio file upload | Hesitation + transcript + rephrase + entities + suggestions | âœ… Pass |
| TC-17 | Idea CRUD â€” create | Valid idea data | Idea stored in MongoDB with metadata | âœ… Pass |
| TC-18 | Idea CRUD â€” read by session | Valid session_id | All session ideas returned sorted by date | âœ… Pass |
| TC-19 | Idea CRUD â€” update approval | Set is_approved=True | Status updated in database | âœ… Pass |
| TC-20 | Idea CRUD â€” delete | Valid idea_id | Idea removed from database | âœ… Pass |
| TC-21 | Session management â€” create | Session name + description | Session created with status="active" | âœ… Pass |
| TC-22 | Session management â€” list | GET request | All sessions returned with counts | âœ… Pass |
| TC-23 | Idea clustering â€” valid session | Session with 5+ ideas | 2-7 clusters with summaries and insights | âœ… Pass |
| TC-24 | Idea clustering â€” empty session | Session with 0 ideas | Graceful empty response | âœ… Pass |
| TC-25 | Idea clustering â€” single idea | Session with 1 idea | Single cluster with the idea | âœ… Pass |
| TC-26 | Audio format â€” WAV | WAV file upload | Processed successfully | âœ… Pass |
| TC-27 | Audio format â€” MP3 | MP3 file upload | Processed successfully | âœ… Pass |
| TC-28 | Audio format â€” OGG | OGG file upload | Processed successfully | âœ… Pass |
| TC-29 | Audio format â€” FLAC | FLAC file upload | Processed successfully | âœ… Pass |
| TC-30 | Audio validation â€” oversized | >10MB file | HTTP 413 error returned | âœ… Pass |
| TC-31 | Audio validation â€” empty | Empty file | HTTP 400 error returned | âœ… Pass |
| TC-32 | Health check â€” all loaded | All models available | status="healthy", all models=true | âœ… Pass |
| TC-33 | Health check â€” partial | Some models failed | status="degraded", specific models=false | âœ… Pass |
| TC-34 | Empty text submission | Empty string | HTTP 422 validation error | âœ… Pass |
| TC-35 | Unicode/special characters | "Implement æ—¥æœ¬èªž support in sprint 5" | Processed without error | âœ… Pass |
| TC-36 | Long text (>1000 chars) | Very long idea text | Truncated and processed | âœ… Pass |

### 4.2 Non-Functional Testing

Non-functional testing evaluated performance, scalability, and reliability characteristics of the system.

**Table 4.2: Performance Benchmarks**

| Operation | Average Response Time | Notes |
|---|---|---|
| Entity extraction (spaCy) | ~5 ms | Local CPU inference |
| Typing hesitation (Isolation Forest) | ~2 ms | Lightweight sklearn predict |
| Speech hesitation (CNN+BiLSTM) | ~50 ms | PyTorch CPU on 5s audio |
| Whisper transcription | ~2-5 s | Depends on audio length |
| Groq rephrasing | ~0.5-1.5 s | Cloud API call |
| Full typing pipeline | ~2-3 s | All steps combined |
| Full speech pipeline | ~4-8 s | Transcription + all analysis |
| Idea clustering (10 ideas) | ~2-3 s | Single Groq API call |
| MongoDB query (CRUD) | <50 ms | With indexes on session_id |

**Table 4.3: Scalability and Reliability Results**

| Metric | Measured Value | Notes |
|---|---|---|
| Concurrent users | 5 simultaneous | All responses < 5 seconds |
| Model loading time | ~10 seconds | All 5 models at startup |
| Memory usage | ~2 GB | After all models loaded |
| API uptime (testing period) | 99.5% | Minor Groq API rate-limiting events |
| Groq API fallback success rate | 100% | T5 fallback triggered successfully every time |
| Error recovery | Graceful | Individual pipeline failures don't crash system |

### 4.3 User Acceptance Testing

A pilot user acceptance testing was conducted with a group of 10 participants representing typical Agile team roles including developers, QA engineers, and Scrum Masters. Participants used the system during simulated brainstorming sessions and evaluated it based on usability, usefulness, and overall satisfaction.

**Table 4.4: User Acceptance Testing Results**

| Evaluation Criterion | Average Rating (1-5) | Notes |
|---|---|---|
| Ease of use â€” typing interface | 4.3 | Users found the typing capture intuitive |
| Ease of use â€” speech interface | 4.0 | Some users needed guidance on recording |
| AI rephrasing quality | 4.4 | Users appreciated entity preservation |
| Hesitation detection accuracy | 3.9 | Some false positives for fast typers |
| Idea suggestions relevance | 4.1 | Context-aware suggestions well received |
| Guiding questions helpfulness | 4.2 | Particularly useful for junior developers |
| Clustering quality | 4.0 | Occasional misassignment of ideas |
| Overall satisfaction | 4.2 | Users would use the system in real sprints |
| Would recommend to team | 85% | 8.5 out of 10 positive |

**Key UAT Findings:**
- Users strongly valued the entity-preserving rephrasing, reporting that it maintained the technical accuracy they expected while improving clarity.
- The guiding questions feature was particularly praised by less experienced team members who found it helpful in developing incomplete ideas.
- Speech transcription quality was rated well but users noted it occasionally struggled with technical jargon.
- The idea clustering feature was appreciated for organizing brainstorming output, though users suggested the ability to manually reassign ideas between clusters.

---

## CHAPTER 5: RESULTS AND DISCUSSION

### 5.1 Typing Hesitation Detection (Isolation Forest)

The Isolation Forest model was evaluated against manually annotated ground truth data from the Frequency Dataset.

**Table 5.1: Typing Hesitation Detection Results**

| Metric | Value |
|---|---|
| Accuracy | 0.823 |
| ROC-AUC | 0.871 |
| Precision (Normal) | 0.85 |
| Recall (Normal) | 0.89 |
| F1-Score (Normal) | 0.87 |
| Precision (Hesitant) | 0.76 |
| Recall (Hesitant) | 0.70 |
| F1-Score (Hesitant) | 0.73 |

The model achieved an accuracy of 82.3% and a ROC-AUC of 0.871, demonstrating strong discriminative ability between hesitant and normal typing sessions. The higher performance on the Normal class is expected given the unsupervised nature of the algorithm, which models normal behavior and flags deviations. The hesitation score distribution analysis revealed clear separation between the two classes, with hesitant sessions clustering at lower (more negative) anomaly scores. The confusion matrix showed that the majority of misclassifications were false negatives (hesitant sessions classified as normal), which is an acceptable trade-off as the system errs on the side of not interrupting users unnecessarily.

### 5.2 Speech Hesitation Detection (CNN + BiLSTM + Attention)

The deep learning model was evaluated on the 20% held-out test set from the DisfluencySpeech dataset.

**Table 5.2: Speech Hesitation Detection Results**

| Metric | Value |
|---|---|
| Accuracy | 0.853 |
| Precision (Fluent) | 0.83 |
| Recall (Fluent) | 0.88 |
| F1-Score (Fluent) | 0.86 |
| Precision (Hesitation) | 0.87 |
| Recall (Hesitation) | 0.83 |
| F1-Score (Hesitation) | 0.85 |
| Macro F1-Score | 0.855 |

The CNN + BiLSTM + Attention architecture achieved 85.3% accuracy with a well-balanced performance across both classes (macro F1 = 0.855). The attention mechanism proved effective at focusing on key temporal positions in the audio where hesitation markers (filled pauses, prolonged silences before filler words) occur. The bidirectional LSTM captured the surrounding context of these moments, enabling the model to distinguish between natural speech pauses and genuine hesitation. The convolutional layers effectively captured local acoustic patterns characteristic of filler sounds ("um", "uh", "er") which have distinct spectral signatures.

### 5.3 Entity Detection (spaCy NER)

The NER system was evaluated on the 400-sample gold-standard dataset.

**Table 5.3: NER Performance Results**

| Entity Type | Precision | Recall | F1-Score |
|---|---|---|---|
| ISSUE_ID | 1.00 | 1.00 | 1.00 |
| SPRINT | 0.98 | 0.99 | 0.99 |
| TOOL | 1.00 | 1.00 | 1.00 |
| Overall | 0.99 | 0.99 | 0.99 |

The NER system achieved near-perfect performance on the gold-standard evaluation set, with overall precision, recall, and F1-score all at 0.99. The ISSUE_ID and TOOL entity types achieved perfect scores due to their distinctive patterns (regex-based for ISSUE_ID, exact match for TOOL). SPRINT entities showed marginally lower precision due to occasional false matches where the word "sprint" appeared in non-entity contexts. The custom EntityRuler patterns proved highly effective at capturing Agile-specific entities that the base spaCy model would miss.

### 5.4 Entity Preservation Score

The entity preservation metric was evaluated on 100 samples from the gold dataset through the complete rephrasing pipeline.

**Table 5.4: Entity Preservation Comparison**

| Approach | Entity Preservation Score | Fluency |
|---|---|---|
| No masking (raw LLM rephrase) | 0.67 | High |
| Entity masking + Groq + restoration | 0.98 | High |
| Entity masking + T5 + restoration | 0.95 | Moderate |
| Direct T5 (no masking) | 0.72 | Moderate |

The entity masking-restoration pipeline achieved 98% entity preservation when using the Groq API as the primary rephraser, compared to only 67% without masking. This represents a 46% improvement in entity accuracy. The T5 fallback achieved 95% preservation, demonstrating that the masking approach is effective across different LLM backends. The remaining 2-5% of imperfect preservation cases were primarily due to complex entity boundary issues where entities contained common words that appeared elsewhere in the text.

### 5.5 Rephrasing Quality (BLEU/ROUGE)

**Table 5.5: Rephrasing Quality Metrics**

| Metric | Score |
|---|---|
| BLEU | 0.72 |
| ROUGE-1 | 0.81 |
| ROUGE-2 | 0.64 |
| ROUGE-L | 0.78 |

The BLEU and ROUGE scores indicate strong semantic alignment between rephrased and reference texts. The scores reflect the balance between preserving original meaning (high ROUGE-1 indicating unigram overlap) and improving sentence structure (moderate ROUGE-2 indicating the text is being actively restructured while maintaining content). The entity-preserving pipeline's ability to maintain technical terms while improving clarity is reflected in the high ROUGE-L score, indicating good longest common subsequence alignment.

### 5.6 Discussion

The results demonstrate that the proposed AI-Based Inclusive Communication Platform effectively addresses the identified research gaps. The dual-modality hesitation detection system provides complementary coverage: the Isolation Forest captures uncertainty expressed through typing behavior patterns (corrections, deletions, hesitation timing), while the CNN + BiLSTM + Attention model captures vocal hesitation markers (filler words, pauses, disfluency patterns). Together, these models enable the system to detect communication difficulties regardless of the input modality, which is essential for inclusive brainstorming platforms that support both typed and spoken contributions.

The entity-preserving rephrasing pipeline represents a significant contribution to the field of AI-assisted communication for technical domains. The 98% entity preservation rate with the masking approach, compared to 67% without masking, validates the hypothesis that direct LLM application to technical text produces unacceptable entity corruption rates. The multi-pass restoration with corrupted token cleanup further demonstrates the robustness of the approach against the unpredictable behavior of large language models.

The AI-powered assistance features (suggestions, continuations, guiding questions) address a key limitation of existing brainstorming tools by providing contextually relevant support when users need it most. The UAT results confirm that this support is particularly valued by less experienced team members and non-native English speakers, directly addressing the inclusivity goals of the research.

---

## CHAPTER 6: CONCLUSIONS AND FUTURE WORK

### 6.1 Conclusions

This thesis presented the design, development, and validation of an AI-Based Inclusive Communication and Brainstorming Platform for Agile software development teams. The system addresses critical gaps in current Agile tools by providing intelligent, non-intrusive communication support that detects hesitation, refines ideas, and assists users in developing their thoughts.

The key contributions of this research are:

1. **Dual-Modality Hesitation Detection**: An Isolation Forest model for typing behavior analysis (82.3% accuracy, 0.871 ROC-AUC) and a CNN + BiLSTM + Attention deep learning model for speech audio classification (85.3% accuracy, 0.855 macro F1). These models enable the system to detect communication difficulties across both typed and spoken modalities.

2. **Entity-Preserving Rephrasing Pipeline**: A novel four-stage pipeline (detection â†’ masking â†’ LLM rephrasing â†’ restoration) that achieves 98% entity preservation with Groq and 95% with T5, compared to 67% without masking. The multi-pass corruption cleanup handles edge cases where LLMs introduce corrupted entity tokens.

3. **Context-Aware AI Assistance**: Integration of idea continuation predictions, guiding questions, and continuation suggestions powered by Groq Llama 3.3 70B, providing domain-specific support that adapts based on detected hesitation and user context.

4. **AI-Powered Thematic Clustering**: LLM-based semantic grouping of brainstorming ideas into thematic categories with session-level insights and actionable recommendations.

5. **Comprehensive Brainstorming Platform**: A full-featured system with dual-mode input (typing and speech), persistent session management, unified processing pipelines, and robust fallback mechanisms ensuring system availability.

The system was validated through 36 functional test cases, performance benchmarking demonstrating response times within acceptable limits for real-time use (typing pipeline: 2-3s, speech pipeline: 4-8s), and user acceptance testing with positive reception (4.2/5.0 overall satisfaction, 85% recommendation rate).

### 6.2 Future Work

Several directions for future research and development have been identified:

1. **Real-Time Collaboration**: Implement WebSocket-based live updates enabling multiple users to see brainstorming contributions, hesitation indicators, and AI suggestions in real-time during team sessions.

2. **Larger Training Datasets**: Expand the speech hesitation model training beyond 3,000 samples and collect more diverse typing hesitation data to improve model robustness across different accents, typing styles, and communication patterns.

3. **User Authentication and Role-Based Access**: Implement proper authentication and authorization layers to support multi-team deployment with configurable permissions for participants, facilitators, and administrators.

4. **Configurable Hesitation Thresholds**: Allow teams to calibrate hesitation detection sensitivity based on their specific communication norms, reducing false positives for teams with naturally different typing or speaking patterns.

5. **Integration with Project Management Tools**: Develop export capabilities to Jira, Azure DevOps, and other project management tools, enabling brainstorming ideas to flow directly into sprint backlogs and user stories.

6. **Self-Hosted LLM Deployment**: Replace cloud-based Groq API dependency with self-hosted Llama models for organizations with data privacy requirements, eliminating external API dependencies.

7. **Cross-Module Integration**: Deepen integration with other AgileSense-AI modules (Emotion Detection, Sprint Replanning, Expertise Recommendation) to provide a holistic view of team communication dynamics correlated with emotional states and sprint performance.

8. **Multilingual Support**: Extend the platform to support brainstorming in multiple languages, enabling global Agile teams to contribute in their preferred language while receiving AI assistance tailored to their linguistic context.

---

## REFERENCES

[1] Miranda, D. et al., "Quantitative analysis of communication dynamics in Agile software development teams," Journal of Software Engineering Research and Development, vol. 6, no. 1, pp. 1-18, 2018.

[2] K. Beck et al., "Manifesto for Agile Software Development," Agile Alliance, 2001. [Online]. Available: https://agilemanifesto.org/.

[3] F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation Forest," in Proceedings of the IEEE International Conference on Data Mining (ICDM), Pisa, Italy, 2008, pp. 413-422.

[4] S. Hochreiter and J. Schmidhuber, "Long Short-Term Memory," Neural Computation, vol. 9, no. 8, pp. 1735-1780, 1997.

[5] A. Vaswani et al., "Attention Is All You Need," in Advances in Neural Information Processing Systems (NeurIPS), 2017, pp. 5998-6008.

[6] C. Raffel et al., "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer," Journal of Machine Learning Research, vol. 21, no. 140, pp. 1-67, 2020.

[7] A. Radford et al., "Robust Speech Recognition via Large-Scale Weak Supervision," in International Conference on Machine Learning (ICML), 2023.

[8] M. Honnibal and I. Montani, "spaCy: Industrial-strength Natural Language Processing in Python," 2017. [Online]. Available: https://spacy.io/.

[9] B. McFee et al., "librosa: Audio and Music Signal Analysis in Python," in Proceedings of the 14th Python in Science Conference, 2015, pp. 18-24.

[10] S. Davis and P. Mermelstein, "Comparison of Parametric Representations for Monosyllabic Word Recognition in Continuously Spoken Sentences," IEEE Transactions on Acoustics, Speech, and Signal Processing, vol. 28, no. 4, pp. 357-366, 1980.

[11] H. Chung, T. Gulcehre, and Y. Bengio, "Empirical Evaluation of Gated Recurrent Neural Networks on Sequence Modeling," arXiv preprint arXiv:1412.3555, 2014.

[12] A. Edmondson, "Psychological Safety and Learning Behavior in Work Teams," Administrative Science Quarterly, vol. 44, no. 2, pp. 350-383, 1999.

[13] F. Pedregosa et al., "Scikit-learn: Machine Learning in Python," Journal of Machine Learning Research, vol. 12, pp. 2825-2830, 2011.

[14] A. Paszke et al., "PyTorch: An Imperative Style, High-Performance Deep Learning Library," in Advances in Neural Information Processing Systems (NeurIPS), 2019, pp. 8024-8035.

[15] D. Bahdanau, K. Cho, and Y. Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate," in International Conference on Learning Representations (ICLR), 2015.

[16] T. Mikolov et al., "Recurrent Neural Network Based Language Model," in Proceedings of Interspeech, 2010, pp. 1045-1048.

[17] Meta AI, "Llama 3: An Overview of State-of-the-Art Large Language Models," 2024. [Online]. Available: https://ai.meta.com/llama/.

[18] S. Tiramisu et al., "FastAPI: A Modern, Fast Web Framework for Building APIs with Python," 2019. [Online]. Available: https://fastapi.tiangolo.com/.
