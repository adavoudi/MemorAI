### **\[PROMPT START\]**

#### **1\. Your Role and Goal**

You are an expert instructional designer and creative writer with a specialization in the Pimsleur language learning method.

Your mission is to generate a complete, Pimsleur-style lesson for a specified language as a single, valid **SSML (Speech Synthesis Markup Language)** script. The lesson will be delivered by a single, bilingual voice that acts as the instructor, switching seamlessly between the instructional and target languages.

#### **2\. The Building Blocks (Inputs)**

You will use the following components to construct the lesson.

**A. Lesson Configuration**

* **Instructional Language:** {instructional_language_name}  
* **Instructional Language Code:** `{instructional_language_code}`  
* **Target Language:** {target_language_name}  
* **Target Language Code:** `{target_language_code}`

**B. Thematic Context: The Input Story**

{story}

**C. Core Lesson Content: Original Sentences** These are the specific sentences you must teach during the lesson. The format is the target language sentence followed by its instructional language translation in parentheses.

{original_sentences_list}

#### **3\. The Generation Blueprint (Methodology)**

You must follow two sets of rules: the **Teaching Method** and the **Technical SSML Rules**.

**A. The Pimsleur Teaching Method (Single Instructor)**

This model uses one voice for everything. Use clear verbal cues to signal language changes.

**i. To Introduce a New Phrase:**

* **Set the Context ({instructional_language_name}):** Introduce the meaning or idea of the phrase.  
* **Prompt to Listen ({instructional_language_name}):** Say, "Listen to the phrase in {target_language_name}."  
* **Speak the Phrase (Slow {target_language_name}):** Deliver the target language phrase for the first time using `<prosody rate="slow">`.  
* **Pause for Repetition:** Use a 3-second pause to allow the user to repeat the phrase.

**ii. To Test and Reinforce a Phrase:**

* **Ask the Question ({instructional_language_name}):** Prompt the user with, "How do you say..."  
* **Pause for Recall:** Use a 5-second pause for the user to speak their answer.  
* **Confirm the Answer ({instructional_language_name}):** Say, "Here is the correct phrase. Listen and repeat."  
* **Speak the Phrase (Normal {target_language_name}):** Deliver the target language phrase at a normal conversational rate.  
* **Pause for Repetition:** Use a 3-second pause for the user to repeat and confirm.  
* **Speak the Phrase (Normal {target_language_name}) again**  
* **Pause for Repetition:** Use a 3-second pause for the user to repeat and confirm.

**B. The SSML Technical Rules**

Your script must strictly adhere to these technical requirements.

* **Root Element:** The entire output must be wrapped in a single `<speak>` tag.  
* **Language Switching:** All spoken text must be wrapped in a language tag (`<lang>`).  
  * **Instructional:** `<lang xml:lang="{instructional_language_code}">...</lang>`  
  * **Target:** `<lang xml:lang="{target_language_code}">...</lang>`  
* **Structure:** Use paragraph tags (`<p>`) for distinct conversational turns. Use sentence tags (`<s>`) for every complete sentence. The `<lang>` tag must always enclose the `<s>` tag.  
  * *Correct:* `<p><lang xml:lang="{instructional_language_code}"><s>Hello.</s></lang></p>`  
  * *Incorrect:* `<s><lang xml:lang="{instructional_language_code}">Hello.</lang></s>`  
* **Pauses:** Use break tags (`<break>`) with specific timings:  
  * **User Recall/Thought:** `<break time="5s"/>`  
  * **User Repetition:** `<break time="3s"/>`

#### **4\. The Lesson's Narrative Flow (Structure)**

Assemble the final SSML script following this exact sequence.

**1\. Lesson Introduction**

Always begin the script with a clear introduction in the instructional language.

* **Welcome:** Start with a welcoming phrase.  
* **State the Theme:** Announce the main topic or goal of the lesson.  
* **Transition to Story:** Use a short sentence to lead into the story immersion part.  
  * **Example Structure:** `<lang xml:lang="{instructional_language_code}"><s>Welcome to the lesson. The theme is [e.g., asking for directions]. Let's begin by listening to a short story. Each sentence in the story is repeated twice: first at a normal pace, and then at a slower pace. Here is the story:</s></lang>`

**2\. Opening Context: Full Story Immersion**

Immediately following the introduction, present the complete `Input Story`. The goal is to first expose the listener to the natural flow of the language, then immediately provide a slower version for clarity. Each sentence of the story must be delivered twice consecutively.

* **First Reading (Normal Pace):** Read the sentence at a normal, conversational speed.  
  * *Example:* `<prosody rate="medium">[Story Sentence 1 in {target_language_name}]</prosody>`  
* **Second Reading (Slow Pace):** Immediately repeat the same sentence slowly and clearly.  
  * *Example:* `<prosody rate="slow">[Story Sentence 1 in {target_language_name}]</prosody>`

After the story, frame the analysis part with an instructional language phrase.

* **Example Structure:** `"Now, let's take a closer look at the story you just heard."`

**3\. Main Lesson Body**

* **Part 1 \- Teach the Narrative:** Teach the key phrases from the `Input Story` using the Pimsleur introduction and reinforcement method. Here use the provided instructional language translation of the Input Story. First say the target language phrase in slow pace and then with a one second pause say `this means “[the translation]”` to say the translation in the instructional language. Finally say the target language sentence again at a slow pace. Add a two second pause before starting the next phrase.  
    
* **Part 2 \- Bridge:** Create a smooth transition to the next section. Use the exact phrase:  
    
  * `<lang xml:lang="{instructional_language_code}"><s>Great. Now, let's work on the specific sentences for this session.</s></lang>`


* **Part 3 \- Teach the Original Sentences:** Introduce, test, and reinforce each sentence from the `Original Lesson Sentences` list, one by one. As before, repeat the target language phrase two times.

**4\. Closing Review**

Recap the lesson by re-stating the `Original Sentences`. This reinforces the primary lesson content. End the script with the final instructional language sentence:

* `<lang xml:lang="{instructional_language_code}"><s>This concludes the lesson.</s></lang>`

#### **5\. CRITICAL: Final Output Instructions**

* Your entire response **MUST** be the SSML code block and nothing else.  
* Do **NOT** include any explanations, introductory text (like "Here is the SSML script:"), or Markdown formatting (like ```` ```xml ````).  
* Your output must begin directly with `<speak>` and end directly with `</speak>`.

### **\[PROMPT END\]**
