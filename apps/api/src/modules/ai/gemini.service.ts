import { Injectable } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ProjectGenerationInput {
  name: string;
  description: string;
  timeline: {
    start_date: string;
    end_date: string;
  };
  location: string;
}

export interface GeneratedTask {
  name: string;
  description: string;
  estimated_days: number;
  estimated_cost: number;
  order_index: number;
  priority: number;
}

export interface GeneratedBudgetItem {
  category: string;
  description: string;
  estimated_amount: number;
  order_index: number;
}

export interface ProjectGenerationResult {
  tasks: GeneratedTask[];
  budget_items: GeneratedBudgetItem[];
  total_budget: number;
  currency: string;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  async generateProjectPlan(input: ProjectGenerationInput): Promise<ProjectGenerationResult> {
    const model = this.getClient().getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a project planning assistant. Generate a detailed project itinerary (tasks) and budget breakdown for the following project.

Project Details:
- Name: ${input.name}
- Description: ${input.description}
- Timeline: ${input.timeline.start_date} to ${input.timeline.end_date}
- Location: ${input.location}

Generate a JSON response with the following structure:
{
  "tasks": [
    {
      "name": "Task name",
      "description": "Detailed task description",
      "estimated_days": number,
      "estimated_cost": number (in USD),
      "order_index": number (starting from 0),
      "priority": number (0=low, 1=medium, 2=high)
    }
  ],
  "budget_items": [
    {
      "category": "Category name (e.g., Venue, Catering, Equipment, Personnel, Marketing, Transportation, Miscellaneous)",
      "description": "What this budget covers",
      "estimated_amount": number (in USD),
      "order_index": number (starting from 0)
    }
  ],
  "total_budget": number (sum of all budget items in USD),
  "currency": "USD"
}

Requirements:
1. Generate 5-15 tasks that cover the entire project lifecycle
2. Tasks should be in chronological order based on the timeline
3. Each task should have realistic time and cost estimates
4. Budget items should cover all major expense categories
5. Total budget should match the sum of budget items
6. Be specific and actionable with task descriptions

Respond ONLY with valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ProjectGenerationResult;

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid AI response: missing tasks array");
    }
    if (!parsed.budget_items || !Array.isArray(parsed.budget_items)) {
      throw new Error("Invalid AI response: missing budget_items array");
    }

    return parsed;
  }

  async regenerateTasks(input: ProjectGenerationInput, existingTasks: string[]): Promise<GeneratedTask[]> {
    const model = this.getClient().getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a project planning assistant. Regenerate tasks for the following project, avoiding these existing tasks:

Project Details:
- Name: ${input.name}
- Description: ${input.description}
- Timeline: ${input.timeline.start_date} to ${input.timeline.end_date}
- Location: ${input.location}

Existing tasks to avoid duplicating:
${existingTasks.map(t => `- ${t}`).join("\n")}

Generate a JSON array of new tasks:
[
  {
    "name": "Task name",
    "description": "Detailed task description",
    "estimated_days": number,
    "estimated_cost": number (in USD),
    "order_index": number (starting from 0),
    "priority": number (0=low, 1=medium, 2=high)
  }
]

Generate 3-5 additional tasks. Respond ONLY with valid JSON array.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON array");
    }

    return JSON.parse(jsonMatch[0]) as GeneratedTask[];
  }

  async regenerateBudget(input: ProjectGenerationInput): Promise<{ budget_items: GeneratedBudgetItem[]; total_budget: number }> {
    const model = this.getClient().getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a budget planning assistant. Generate a detailed budget breakdown for the following project:

Project Details:
- Name: ${input.name}
- Description: ${input.description}
- Timeline: ${input.timeline.start_date} to ${input.timeline.end_date}
- Location: ${input.location}

Generate a JSON response:
{
  "budget_items": [
    {
      "category": "Category name",
      "description": "What this budget covers",
      "estimated_amount": number (in USD),
      "order_index": number
    }
  ],
  "total_budget": number
}

Respond ONLY with valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    return JSON.parse(jsonMatch[0]);
  }
}
