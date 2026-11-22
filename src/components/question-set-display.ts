



export function QuestionSetDisplay({ questionSets }: { questionSets: IQuestionSet[] }) {
  return (
    <div>
      {questionSets.map((questionSet) => (
        <div key={questionSet.id}>
          <h2>{questionSet.title}</h2>
          <p>Total Questions: {questionSet.totalCount}</p>
        </div>
      ))}
    </div>
  );
}