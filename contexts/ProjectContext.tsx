"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { collection, addDoc, updateDoc, doc, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Project {
  id: string
  name: string
  type: "Mangrove" | "Plantation" | "Restoration"
  location: string
  date: string
  status: "Pending" | "Verified" | "Rejected"
  credits: number
}

interface ProjectContextType {
  projects: Project[]
  addProject: (project: Omit<Project, "id">) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  getTotalCredits: () => number
  loading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'))
    
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[]
      setProjects(projectsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addProject = async (project: Omit<Project, "id">) => {
    const newProject = {
      ...project,
      status: "Pending",
      credits: 0,
    }
    await addDoc(collection(db, 'projects'), newProject)
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const projectRef = doc(db, 'projects', id)
    await updateDoc(projectRef, updates)
  }

  const getTotalCredits = () => {
    return projects
      .filter((project) => project.status === "Verified")
      .reduce((total, project) => total + project.credits, 0)
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        addProject,
        updateProject,
        getTotalCredits,
        loading
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider")
  }
  return context
}
