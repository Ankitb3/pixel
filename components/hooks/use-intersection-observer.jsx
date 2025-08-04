"use client"
import React, { useEffect, useRef, useState } from 'react'

const useIntersectionObserver = (threshold =0.1) => {
    const[isVisible,setIsVisible] = useState();
    const ref = useRef()
    useEffect(()=>{
     const observer = new IntersectionObserver(([entery])=>setIsVisible(entery),{threshold})
    
     if(ref.current) observer.observe(ref.current);
     return()=>observer.disconnect();
    },[threshold]);
  return [ref,isVisible]
}

export default useIntersectionObserver;