
import "./InnerCard.css";

function InnerCard({ title, children, className, style }) {
    return (
        <div className={`inner-card ${className ? className : ""}`} style={style}>
            
            <div className="inner-card-title">{title}</div>
            
            <div className="card-body">{children}</div>
        </div>
    );
}

export default InnerCard;