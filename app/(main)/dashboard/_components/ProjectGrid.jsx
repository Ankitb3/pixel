"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import ProjectCard from './ProjectCard'

const ProjectGrid = ({projects}) => {
    const router = useRouter()
    const handleEditProject=(id)=>{
       router.push(`/editor/${id}`)
    }
    console.log('====================================');
    console.log(projects,"pppp");
    console.log('====================================');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {
            projects.map((project)=>{
               return <ProjectCard key={project._id} project={project} onEdit={()=>handleEditProject(project._id)}/>
            })
        }
    </div>
  )
}

export default ProjectGrid