'use client'

import { Button, Flex } from '@sanity/ui'
import type { NavbarProps } from 'sanity'

export function CustomNavbar(props: NavbarProps) {
  return (
    <Flex direction="column">
      <Flex padding={2} justify="flex-end" style={{ borderBottom: '1px solid #e3e3e3' }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Button text="Vedi sito" mode="ghost" tone="primary" />
        </a>
      </Flex>
      {props.renderDefault(props)}
    </Flex>
  )
}
