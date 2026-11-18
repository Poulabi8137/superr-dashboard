import type { ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from "react";

export function Card({children,className=""}:{children:ReactNode;className?:string}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export function SectionHeading({title,detail,action}:{title:string;detail?:string;action?:ReactNode}) {
  return <div className="section-heading"><div><h2>{title}</h2>{detail&&<p>{detail}</p>}</div>{action}</div>;
}
export function Button(props:ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`button ${props.className||""}`} />;
}
export function Select(props:SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`select ${props.className||""}`} />;
}
export function Metric({label,value,delta,icon}:{label:string;value:string;delta?:string;icon:ReactNode}) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong>{delta&&<small>{delta}</small>}</div>;
}
export function EmptyState({title,body}:{title:string;body:string}) {
  return <div className="empty-state"><strong>{title}</strong><span>{body}</span></div>;
}
