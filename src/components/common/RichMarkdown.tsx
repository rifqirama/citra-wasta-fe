import React from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  markdown: string;
}

const RichMarkdown: React.FC<Props> = ({ markdown }) => {
  return <ReactMarkdown>{markdown}</ReactMarkdown>;
};

export default RichMarkdown;

