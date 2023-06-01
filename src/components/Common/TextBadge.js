import React from 'react'

export default function TextBadge({ text, textColor ,bgColor}) {
  return (
      <div
          style={{
              borderRadius: 10,
              padding: '8px 16px',
              background: bgColor,
              width: 'fit-content',
              display: 'inline-flex',
              marginLeft:8
          }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: textColor, }}>{text}</span>
      </div>
  )
}
