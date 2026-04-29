"""
AI Integration Service Layer
Supports multiple AI providers: OpenAI, Gemini, Anthropic (Claude)
"""
import os
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class GrammarResult:
    original_text: str
    corrected_text: str
    suggestions: List[Dict[str, Any]]
    errors_found: int


@dataclass
class SummaryResult:
    original_length: int
    summary: str
    summary_length: int
    compression_ratio: float
    key_insights: Optional[List[str]] = None


class AIService:
    """Base class for AI providers"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        raise NotImplementedError
    
    def summarize(self, text: str, max_length: int = 150, style: str = 'concise') -> SummaryResult:
        raise NotImplementedError
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        raise NotImplementedError
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        raise NotImplementedError


class OpenAIService(AIService):
    """OpenAI GPT integration"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.base_url = "https://api.openai.com/v1"
    
    def _call_api(self, messages: List[Dict], max_tokens: int = 500) -> str:
        """Make API call to OpenAI"""
        import requests
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        prompt = f"""Check the grammar and spelling in the following text. Provide:
1. The corrected text
2. A list of errors found with explanations and corrections in JSON format

Text: {text}

Format your response as JSON:
{{
    "corrected_text": "the corrected text",
    "suggestions": [
        {{
            "original": "error text",
            "correction": "fixed text",
            "explanation": "why this is wrong",
            "position": "approximate position in text"
        }}
    ],
    "errors_found": number_of_errors
}}"""
        
        messages = [{"role": "user", "content": prompt}]
        response = self._call_api(messages, max_tokens=1500)
        
        try:
            result = json.loads(response)
            return GrammarResult(
                original_text=text,
                corrected_text=result.get('corrected_text', text),
                suggestions=result.get('suggestions', []),
                errors_found=result.get('errors_found', 0)
            )
        except json.JSONDecodeError:
            return GrammarResult(
                original_text=text,
                corrected_text=text,
                suggestions=[],
                errors_found=0
            )
    
    def summarize(self, text: str, max_length: int = 150, style: str = 'concise') -> SummaryResult:
        style_instructions = {
            'concise': f"Provide a concise summary in about {max_length} characters.",
            'detailed': f"Provide a detailed summary covering key points, around {max_length} characters.",
            'bullet_points': "Provide 3-5 bullet points summarizing the key information.",
            'key_points': "Extract the 3-5 most important points from this text."
        }
        
        prompt = f"""Summarize the following text. {style_instructions.get(style, style_instructions['concise'])}

Text: {text}

Format your response as JSON:
{{
    "summary": "your summary here",
    "key_insights": ["insight 1", "insight 2", ...]
}}"""
        
        messages = [{"role": "user", "content": prompt}]
        response = self._call_api(messages, max_tokens=800)
        
        try:
            result = json.loads(response)
            summary = result.get('summary', response[:max_length])
            return SummaryResult(
                original_length=len(text),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(text) if len(text) > 0 else 0,
                key_insights=result.get('key_insights', [])
            )
        except json.JSONDecodeError:
            summary = response[:max_length]
            return SummaryResult(
                original_length=len(text),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(text) if len(text) > 0 else 0
            )
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        items_json = json.dumps(items, indent=2)
        
        type_instructions = {
            'overview': "Provide a comprehensive overview of all the data.",
            'trends': "Identify trends and patterns in the data.",
            'comparison': "Compare and contrast the different items in the data.",
            'key_insights': "Extract the most important insights from this collection of data."
        }
        
        prompt = f"""Analyze and summarize the following collection of data items. {type_instructions.get(summary_type, type_instructions['overview'])}

Data:
{items_json}

Format your response as JSON:
{{
    "summary": "your summary here",
    "key_insights": ["insight 1", "insight 2", ...]
}}"""
        
        messages = [{"role": "user", "content": prompt}]
        response = self._call_api(messages, max_tokens=1000)
        
        try:
            result = json.loads(response)
            summary = result.get('summary', response)
            return SummaryResult(
                original_length=len(items_json),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(items_json) if len(items_json) > 0 else 0,
                key_insights=result.get('key_insights', [])
            )
        except json.JSONDecodeError:
            return SummaryResult(
                original_length=len(items_json),
                summary=response,
                summary_length=len(response),
                compression_ratio=len(response) / len(items_json) if len(items_json) > 0 else 0
            )
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        format_instructions = {
            'paragraph': "Explain in a clear paragraph format.",
            'steps': "Break down the explanation into numbered steps.",
            'analogy': "Use an analogy to help explain this concept."
        }
        
        audience_instructions = {
            'beginner': "Explain as if to a beginner with no prior knowledge.",
            'intermediate': "Explain with some technical detail but keep it accessible.",
            'expert': "Provide a detailed technical explanation."
        }
        
        prompt = f"""Explain the following text. {format_instructions.get(format, format_instructions['paragraph'])}
{audience_instructions.get(audience, audience_instructions['intermediate'])}

Text: {text}"""
        
        messages = [{"role": "user", "content": prompt}]
        return self._call_api(messages, max_tokens=800)


class GroqService(AIService):
    """Groq AI integration (Llama, Mixtral, Gemma models)"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.environ.get('GROQ_API_KEY')
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = "llama3-8b-8192"  # Default fast model
    
    def _call_api(self, messages: List[Dict], max_tokens: int = 500) -> str:
        """Make API call to Groq"""
        import requests
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        """Check grammar using Groq AI with strict JSON output"""
        import json
        
        prompt = f"""You are a grammar and spelling checker. Analyze the following text carefully and identify ALL spelling mistakes, grammar errors, and typos.

Text to check: "{text}"

Respond ONLY with a JSON object in this exact format:
{{
    "corrected_text": "the fully corrected text here",
    "errors_found": 2,
    "suggestions": [
        {{
            "original": "comiling",
            "correction": "compiling",
            "explanation": "Spelling error: 'comiling' should be 'compiling' or 'coming'"
        }},
        {{
            "original": "lif",
            "correction": "life",
            "explanation": "Spelling error: 'lif' should be 'life'"
        }}
    ]
}}

If no errors found:
{{
    "corrected_text": "{text}",
    "errors_found": 0,
    "suggestions": []
}}

IMPORTANT: 
- Check for spelling mistakes like "comiling" → "compiling"
- Check for missing words like "how us" → "how is"
- Check for incomplete words like "lif" → "life"
- Return valid JSON only, no markdown, no extra text"""
        
        messages = [{"role": "user", "content": prompt}]
        
        try:
            response = self._call_api(messages, max_tokens=800)
            
            # Extract JSON from response
            try:
                # Try to parse directly
                result = json.loads(response)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                import re
                json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', response, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(1))
                else:
                    # Try to find any JSON-like object
                    json_match = re.search(r'({[\s\S]*})', response)
                    if json_match:
                        result = json.loads(json_match.group(1))
                    else:
                        raise ValueError("No JSON found in response")
            
            # Build suggestions list
            suggestions = []
            for sug in result.get('suggestions', []):
                suggestions.append({
                    'original': sug.get('original', ''),
                    'correction': sug.get('correction', ''),
                    'explanation': sug.get('explanation', ''),
                    'rule': 'SPELLING'
                })
            
            return GrammarResult(
                original_text=text,
                corrected_text=result.get('corrected_text', text),
                suggestions=suggestions,
                errors_found=result.get('errors_found', len(suggestions))
            )
            
        except Exception as e:
            print(f"[Groq] Grammar check error: {e}")
            print(f"[Groq] Response was: {response[:500] if 'response' in locals() else 'N/A'}")
            # Fallback to LanguageTool
            return LanguageToolService().check_grammar(text, language)
    
    def summarize(self, text: str, max_length: int = 200, style: str = 'concise') -> SummaryResult:
        style_prompts = {
            'concise': 'Provide a brief summary in 1-2 sentences.',
            'detailed': 'Provide a comprehensive summary with key points.',
            'bullet_points': 'Provide a bullet-point summary of main ideas.'
        }
        
        prompt = f"""Summarize the following text. {style_prompts.get(style, style_prompts['concise'])}

Text: {text[:4000]}

Summary (max {max_length} chars):

Also provide 2-3 key insights as bullet points:"""
        
        messages = [{"role": "user", "content": prompt}]
        response = self._call_api(messages, max_tokens=max_length)
        
        key_insights = []
        try:
            lines = response.split('\n')
            summary_lines = []
            insights_section = False
            for line in lines:
                if 'key insight' in line.lower() or line.strip().startswith('-'):
                    insights_section = True
                if insights_section and line.strip().startswith('-'):
                    key_insights.append(line.strip()[1:].strip())
                elif not insights_section and line.strip():
                    summary_lines.append(line)
            summary = ' '.join(summary_lines)
        except:
            summary = response
        
        return SummaryResult(
            original_text=text,
            summary=summary[:max_length],
            original_length=len(text),
            summary_length=len(summary),
            compression_ratio=len(summary) / len(text) if len(text) > 0 else 0,
            key_insights=key_insights[:3] if key_insights else []
        )
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        items_json = json.dumps(items[:20], indent=2)
        
        prompt = f"""Analyze and summarize the following collection of {len(items)} items.
Type: {summary_type}

Items:
{items_json}

Provide:
1. A brief summary (2-3 sentences)
2. Key insights or patterns (3-5 bullet points)
3. Notable trends"""
        
        messages = [{"role": "user", "content": prompt}]
        response = self._call_api(messages, max_tokens=800)
        
        try:
            summary = response.split('\n')[0] if response else f"Summary of {len(items)} items"
            key_insights = [line.strip()[2:].strip() for line in response.split('\n') if line.strip().startswith('-')]
            
            return SummaryResult(
                original_length=len(items_json),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(items_json) if len(items_json) > 0 else 0,
                key_insights=key_insights[:5]
            )
        except:
            return SummaryResult(
                original_length=len(items_json),
                summary=response,
                summary_length=len(response),
                compression_ratio=0.5
            )
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        format_instructions = {
            'paragraph': "Explain in a clear paragraph format.",
            'steps': "Break down the explanation into numbered steps.",
            'analogy': "Use an analogy to help explain this concept."
        }
        
        audience_instructions = {
            'beginner': "Explain as if to a beginner with no prior knowledge.",
            'intermediate': "Explain with some technical detail but keep it accessible.",
            'expert': "Provide a detailed technical explanation."
        }
        
        prompt = f"""Explain the following text. {format_instructions.get(format, format_instructions['paragraph'])}
{audience_instructions.get(audience, audience_instructions['intermediate'])}

Text: {text}"""
        
        messages = [{"role": "user", "content": prompt}]
        return self._call_api(messages, max_tokens=800)


class GeminiService(AIService):
    """Google Gemini integration"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    def _call_api(self, prompt: str, max_tokens: int = 500) -> str:
        """Make API call to Gemini"""
        import requests
        
        url = f"{self.base_url}/models/gemini-pro:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.3
            }
        }
        
        try:
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        prompt = f"""Check the grammar and spelling in the following text. Provide the corrected text and list of errors in JSON format:

Text: {text}

Response format:
{{
    "corrected_text": "...",
    "suggestions": [
        {{
            "original": "...",
            "correction": "...",
            "explanation": "...",
            "position": "..."
        }}
    ],
    "errors_found": number
}}"""
        
        response = self._call_api(prompt, max_tokens=1500)
        
        try:
            result = json.loads(response)
            return GrammarResult(
                original_text=text,
                corrected_text=result.get('corrected_text', text),
                suggestions=result.get('suggestions', []),
                errors_found=result.get('errors_found', 0)
            )
        except json.JSONDecodeError:
            return GrammarResult(
                original_text=text,
                corrected_text=text,
                suggestions=[],
                errors_found=0
            )
    
    def summarize(self, text: str, max_length: int = 150, style: str = 'concise') -> SummaryResult:
        style_map = {
            'concise': f"Provide a concise summary (about {max_length} characters).",
            'detailed': f"Provide a detailed summary ({max_length} characters).",
            'bullet_points': "Provide bullet point summary.",
            'key_points': "Extract key points."
        }
        
        prompt = f"""{style_map.get(style, style_map['concise'])}

Text: {text}

Return JSON format:
{{
    "summary": "...",
    "key_insights": ["...", "..."]
}}"""
        
        response = self._call_api(prompt, max_tokens=800)
        
        try:
            result = json.loads(response)
            summary = result.get('summary', response[:max_length])
            return SummaryResult(
                original_length=len(text),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(text) if len(text) > 0 else 0,
                key_insights=result.get('key_insights', [])
            )
        except json.JSONDecodeError:
            summary = response[:max_length]
            return SummaryResult(
                original_length=len(text),
                summary=summary,
                summary_length=len(summary),
                compression_ratio=len(summary) / len(text) if len(text) > 0 else 0
            )
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        items_json = json.dumps(items, indent=2)
        
        type_map = {
            'overview': 'Provide overview.',
            'trends': 'Identify trends.',
            'comparison': 'Compare items.',
            'key_insights': 'Extract key insights.'
        }
        
        prompt = f"""{type_map.get(summary_type, type_map['overview'])}

Data:
{items_json}

Return JSON format:
{{
    "summary": "...",
    "key_insights": ["...", "..."]
}}"""
        
        response = self._call_api(prompt, max_tokens=1000)
        
        try:
            result = json.loads(response)
            return SummaryResult(
                original_length=len(items_json),
                summary=result.get('summary', response),
                summary_length=len(result.get('summary', response)),
                compression_ratio=len(result.get('summary', response)) / len(items_json) if len(items_json) > 0 else 0,
                key_insights=result.get('key_insights', [])
            )
        except json.JSONDecodeError:
            return SummaryResult(
                original_length=len(items_json),
                summary=response,
                summary_length=len(response),
                compression_ratio=len(response) / len(items_json) if len(items_json) > 0 else 0
            )
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        audience_map = {
            'beginner': 'Explain simply.',
            'intermediate': 'Standard explanation.',
            'expert': 'Technical explanation.'
        }
        
        format_map = {
            'paragraph': 'Paragraph format.',
            'steps': 'Step by step.',
            'analogy': 'Use an analogy.'
        }
        
        prompt = f"""{audience_map.get(audience, audience_map['intermediate'])}
{format_map.get(format, format_map['paragraph'])}

Text: {text}"""
        
        return self._call_api(prompt, max_tokens=800)


class LanguageToolService(AIService):
    """LanguageTool - Free grammar and spell checker"""
    
    def __init__(self):
        self.base_url = "https://api.languagetool.org/api/v2"
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        """Check grammar using LanguageTool API"""
        import requests
        
        try:
            # Map language codes
            lang_map = {'en': 'en-US', 'es': 'es', 'fr': 'fr', 'de': 'de'}
            lt_lang = lang_map.get(language, 'en-US')
            
            response = requests.post(
                f"{self.base_url}/check",
                data={
                    'text': text,
                    'language': lt_lang,
                    'enabledOnly': 'false'
                },
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            # Build suggestions
            suggestions = []
            corrected_text = text
            
            # Process matches in reverse order to preserve positions
            matches = result.get('matches', [])
            for match in reversed(matches):
                offset = match.get('offset', 0)
                length = match.get('length', 0)
                message = match.get('message', '')
                replacements = match.get('replacements', [])
                
                if replacements and length > 0:
                    best_replacement = replacements[0].get('value', '')
                    original = text[offset:offset + length]
                    
                    suggestions.append({
                        'original': original,
                        'correction': best_replacement,
                        'explanation': message,
                        'position': f"offset {offset}, length {length}",
                        'rule': match.get('rule', {}).get('id', '')
                    })
                    
                    # Apply correction
                    corrected_text = corrected_text[:offset] + best_replacement + corrected_text[offset + length:]
            
            return GrammarResult(
                original_text=text,
                corrected_text=corrected_text,
                suggestions=suggestions,
                errors_found=len(suggestions)
            )
            
        except Exception as e:
            print(f"[LanguageTool] Error: {e}")
            # Fallback to mock service if LanguageTool fails
            return MockAIService().check_grammar(text, language)
    
    def summarize(self, text: str, max_length: int = 150, style: str = 'concise') -> SummaryResult:
        # LanguageTool doesn't do summarization, use simple extraction
        sentences = text.split('. ')
        summary = '. '.join(sentences[:min(3, len(sentences))])
        if len(summary) > max_length:
            summary = summary[:max_length] + '...'
        
        return SummaryResult(
            original_length=len(text),
            summary=summary,
            summary_length=len(summary),
            compression_ratio=len(summary) / len(text) if len(text) > 0 else 0,
            key_insights=['Extracted key sentences']
        )
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        count = len(items)
        return SummaryResult(
            original_length=len(str(items)),
            summary=f"Collection of {count} items",
            summary_length=20,
            compression_ratio=0.5,
            key_insights=[f'{count} items analyzed']
        )
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        return f"Explanation of: {text[:100]}..."


class MockAIService(AIService):
    """Mock service for development without API keys"""
    
    def check_grammar(self, text: str, language: str = 'en') -> GrammarResult:
        # Simple mock grammar check with basic spell checking
        import re
        
        suggestions = []
        corrected = text
        
        # Common spelling errors dictionary
        common_errors = {
            'teh': 'the',
            'recieve': 'receive',
            'seperate': 'separate',
            'occured': 'occurred',
            'definately': 'definitely',
            'wierd': 'weird',
            'accomodate': 'accommodate',
            'ackward': 'awkward',
            'begining': 'beginning',
            'beleive': 'believe',
            'buisness': 'business',
            'catagory': 'category',
            'collegue': 'colleague',
            'comittee': 'committee',
            'comming': 'coming',
            'conscence': 'conscience',
            'curiousity': 'curiosity',
            'dissapoint': 'disappoint',
            'ecstacy': 'ecstasy',
            'embarass': 'embarrass',
            'existance': 'existence',
            'experiance': 'experience',
            'finaly': 'finally',
            'foriegn': 'foreign',
            'freind': 'friend',
            'goverment': 'government',
            'grat': 'great',
            'harrass': 'harass',
            'hieght': 'height',
            'holliday': 'holiday',
            'humerous': 'humorous',
            'imediately': 'immediately',
            'independant': 'independent',
            'knowlege': 'knowledge',
            'lenght': 'length',
            'liek': 'like',
            'loosing': 'losing',
            'maintainance': 'maintenance',
            'millenium': 'millennium',
            'mispell': 'misspell',
            'neccessary': 'necessary',
            'noticable': 'noticeable',
            'ocassion': 'occasion',
            'occurance': 'occurrence',
            'paralell': 'parallel',
            'paricular': 'particular',
            'peice': 'piece',
            'persistant': 'persistent',
            'posession': 'possession',
            'prefered': 'preferred',
            'presance': 'presence',
            'priviledge': 'privilege',
            'probly': 'probably',
            'publically': 'publicly',
            'recieve': 'receive',
            'refering': 'referring',
            'relevent': 'relevant',
            'religous': 'religious',
            'remeber': 'remember',
            'resistence': 'resistance',
            'sence': 'sense',
            'seperate': 'separate',
            'similer': 'similar',
            'sincerly': 'sincerely',
            'speach': 'speech',
            'strait': 'straight',
            'succesful': 'successful',
            'suprise': 'surprise',
            'suround': 'surround',
            'thier': 'their',
            'tommorow': 'tomorrow',
            'truely': 'truly',
            'tyrany': 'tyranny',
            'untill': 'until',
            'wierd': 'weird',
            'wich': 'which',
            'yourslef': 'yourself',
        }
        
        # Check each word
        words = re.findall(r'\b[a-zA-Z]+\b', text)
        for word in words:
            word_lower = word.lower()
            if word_lower in common_errors:
                correction = common_errors[word_lower]
                # Preserve capitalization
                if word[0].isupper():
                    correction = correction.capitalize()
                
                suggestions.append({
                    'original': word,
                    'correction': correction,
                    'explanation': f"Common spelling error: '{word}' should be '{correction}'",
                    'position': f"word in text",
                    'rule': 'SPELLING'
                })
                
                corrected = corrected.replace(word, correction, 1)
        
        return GrammarResult(
            original_text=text,
            corrected_text=corrected,
            suggestions=suggestions,
            errors_found=len(suggestions)
        )
    
    def summarize(self, text: str, max_length: int = 150, style: str = 'concise') -> SummaryResult:
        sentences = text.split('. ')
        summary = '. '.join(sentences[:min(3, len(sentences))])
        
        if len(summary) > max_length:
            summary = summary[:max_length] + '...'
        
        return SummaryResult(
            original_length=len(text),
            summary=summary,
            summary_length=len(summary),
            compression_ratio=len(summary) / len(text) if len(text) > 0 else 0,
            key_insights=['Key point extracted from text']
        )
    
    def batch_summarize(self, items: List[Dict], summary_type: str = 'overview') -> SummaryResult:
        count = len(items)
        summary = f"This collection contains {count} items. [Mock summary - connect to AI provider for real analysis.]"
        
        return SummaryResult(
            original_length=len(str(items)),
            summary=summary,
            summary_length=len(summary),
            compression_ratio=0.5,
            key_insights=[f'Analyzed {count} items', 'Mock insight 1', 'Mock insight 2']
        )
    
    def explain(self, text: str, audience: str = 'intermediate', format: str = 'paragraph') -> str:
        return f"[Mock explanation for: {text[:50]}...] Connect to AI provider for real explanation."


def get_ai_service(provider: Optional[str] = None) -> AIService:
    """Factory function to get appropriate AI service
    
    Providers:
    - 'groq': Groq LLM (fast, uses GROQ_API_KEY) - DEFAULT
    - 'languagetool': Free grammar checker, no API key needed (fallback)
    - 'openai': OpenAI GPT (requires OPENAI_API_KEY)
    - 'gemini': Google Gemini (requires GEMINI_API_KEY)
    - 'mock': Simple fallback with basic rules
    """
    provider = provider or os.environ.get('AI_PROVIDER', 'groq').lower()
    
    if provider == 'openai':
        return OpenAIService()
    elif provider == 'gemini':
        return GeminiService()
    elif provider == 'groq':
        # Check if Groq API key exists
        groq_key = os.environ.get('GROQ_API_KEY', '')
        if groq_key and len(groq_key) > 10:
            return GroqService()
        else:
            print("[AI] GROQ_API_KEY not found, falling back to LanguageTool")
            return LanguageToolService()
    elif provider == 'mock':
        return MockAIService()
    else:
        # Default to LanguageTool for grammar, Groq if configured
        return LanguageToolService()
