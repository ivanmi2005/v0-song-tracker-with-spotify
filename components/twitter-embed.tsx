"use client"

import { useEffect, useRef } from "react"

interface TwitterEmbedProps {
  tweetHtml: string
}

export function TwitterEmbed({ tweetHtml }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    script.charset = "utf-8"
    
    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="flex justify-center my-8"
      dangerouslySetInnerHTML={{ __html: tweetHtml }}
    />
  )
}
