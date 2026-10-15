import React from 'react'
import { AboutType } from '../components/types/types'
import { getAboutParagraphs, getSkillCategories } from '@/lib/data'
import AboutBody from '../components/AboutBody'

const About = async () => {
  const paragraphs = await getAboutParagraphs()
  const skillCategories = await getSkillCategories()

  return (
    <>
      <AboutBody paragraphs={paragraphs} skillCategories={skillCategories} />
    </>
  )
}

export default About
