import { model, models, Schema, Types, type Model } from "mongoose";
import type { Question } from "@/lib/rag";

export interface IQuestionSet {
  _id: string;
  questions: Question[];
  totalCount: number;
  title: string;
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    generationMethod: string;
    documentLength: number;
    generatedAt: Date;
    ragEnabled: boolean;
    aiModel: string;
  };
}

const questionSetSchema = new Schema<IQuestionSet>(
  {
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        difficulty: { type: String, required: true },
        category: { type: String, default: "" },
        cognitive_level: { type: String },
        keywords: { type: [String], default: [] },
        source_context: { type: String, default: "" },
        assessment_criteria: { type: String },
        follow_up_potential: { type: String },
        industry_relevance: { type: String },
      },
    ],
    totalCount: { type: Number, required: true },
    title: { type: String, required: true },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      generationMethod: { type: String, default: "" },
      documentLength: { type: Number, default: 0 },
      generatedAt: { type: Date, default: Date.now },
      ragEnabled: { type: Boolean, default: false },
      aiModel: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const QuestionSetModel: Model<IQuestionSet> =
  models.QuestionSet || model<IQuestionSet>("QuestionSet", questionSetSchema);

export default QuestionSetModel;
