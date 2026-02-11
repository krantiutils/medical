import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FAQRenderer } from "../sections/FAQRenderer";
import { createFAQSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

describe("FAQRenderer", () => {
  const defaultSection = createFAQSection();

  it("renders heading", () => {
    render(<FAQRenderer section={defaultSection} lang="en" />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    const section = createFAQSection({ items: [] });
    render(<FAQRenderer section={section} lang="en" />);
    expect(screen.getByText("No questions added yet")).toBeInTheDocument();
  });

  it("renders question text", () => {
    render(<FAQRenderer section={defaultSection} lang="en" />);
    const question = defaultSection.data.items[0].question;
    expect(screen.getByText(question)).toBeInTheDocument();
  });

  it("does not show answer by default (collapsed)", () => {
    render(<FAQRenderer section={defaultSection} lang="en" />);
    const answer = defaultSection.data.items[0].answer;
    expect(screen.queryByText(answer)).not.toBeInTheDocument();
  });

  it("expands answer when question is clicked", () => {
    render(<FAQRenderer section={defaultSection} lang="en" />);
    const question = defaultSection.data.items[0].question;
    const answer = defaultSection.data.items[0].answer;

    fireEvent.click(screen.getByText(question));
    expect(screen.getByText(answer)).toBeInTheDocument();
  });

  it("collapses answer when clicked again", () => {
    render(<FAQRenderer section={defaultSection} lang="en" />);
    const question = defaultSection.data.items[0].question;
    const answer = defaultSection.data.items[0].answer;

    // Expand
    fireEvent.click(screen.getByText(question));
    expect(screen.getByText(answer)).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText(question));
    expect(screen.queryByText(answer)).not.toBeInTheDocument();
  });

  it("renders Nepali question when lang=ne", () => {
    render(<FAQRenderer section={defaultSection} lang="ne" />);
    const questionNe = defaultSection.data.items[0].questionNe;
    expect(screen.getByText(questionNe)).toBeInTheDocument();
  });

  it("only one FAQ item open at a time", () => {
    const section = createFAQSection({
      items: [
        {
          id: "faq-1",
          question: "Question 1?",
          questionNe: "प्रश्न १?",
          answer: "Answer 1",
          answerNe: "उत्तर १",
        },
        {
          id: "faq-2",
          question: "Question 2?",
          questionNe: "प्रश्न २?",
          answer: "Answer 2",
          answerNe: "उत्तर २",
        },
      ],
    });

    render(<FAQRenderer section={section} lang="en" />);

    // Open first
    fireEvent.click(screen.getByText("Question 1?"));
    expect(screen.getByText("Answer 1")).toBeInTheDocument();

    // Open second - first should close
    fireEvent.click(screen.getByText("Question 2?"));
    expect(screen.getByText("Answer 2")).toBeInTheDocument();
    expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();
  });

  it("applies preset card class", () => {
    const { container } = render(
      <FAQRenderer section={defaultSection} lang="en" preset={STYLE_PRESETS.warm} />,
    );
    const card = container.querySelector(".border-amber-200");
    expect(card).toBeInTheDocument();
  });
});
