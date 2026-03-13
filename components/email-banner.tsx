import React from 'react'
import { Button } from '@/components/ui/button'
import { APP_URL } from '@/lib/config/app-url'

interface EmailBannerProps {
  recipientEmail: string
  senderEmail: string
  className?: string
}

export function EmailBanner({ recipientEmail, senderEmail, className = '' }: EmailBannerProps) {
  const blockUrl = `${APP_URL}/addtoblocklist?email=${encodeURIComponent(recipientEmail)}`

  return (
    <div className={`text-center my-5 px-2.5 py-2 text-xs text-gray-500 border-t border-gray-200 ${className}`}>
      sent via{' '}
      <a 
        href={APP_URL} 
        className="text-purple-500 hover:text-purple-600 no-underline"
      >
        inbound
      </a>
      ,{' '}
      <a 
        href={blockUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-500 hover:text-purple-600 no-underline"
      >
        block {recipientEmail}
      </a>
    </div>
  )
}

export function generateEmailBannerHTML(recipientEmail: string, senderEmail: string): string {
  const blockUrl = `${APP_URL}/addtoblocklist?email=${encodeURIComponent(recipientEmail)}`
  
  return `
    <div style="
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    ">
      sent via <a href="${APP_URL}" style="color: #8b5cf6; text-decoration: none;">inbound</a>, <a href="${blockUrl}" target="_blank" rel="noopener noreferrer" style="color: #8b5cf6; text-decoration: none;">block ${recipientEmail}</a>
    </div>
  `
} 