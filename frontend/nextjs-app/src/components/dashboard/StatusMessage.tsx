type StatusMessageProps = {
  text: string;
};

export default function StatusMessage({ text }: StatusMessageProps) {
  return <p className="status-text">{text}</p>;
}