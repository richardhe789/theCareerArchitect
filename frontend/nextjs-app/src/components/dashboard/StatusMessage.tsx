type StatusMessageProps = {
  text: string;
};

export default function StatusMessage({ text }: StatusMessageProps) {
  return <p className="mt-2 text-sm text-slate-600">{text}</p>;
}