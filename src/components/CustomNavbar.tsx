'use client'

import { Button, Card, Flex, Text } from '@sanity/ui'
import type { NavbarProps } from 'sanity'

// Barra in alto dello Studio: saluto, scorciatoie e "Vedi sito"
export function CustomNavbar(props: NavbarProps) {
  return (
    <Flex direction="column">
      <Card
        paddingX={3}
        paddingY={2}
        style={{
          background: 'linear-gradient(90deg, #0d0f12 0%, #1b1f26 60%, #2a0a0a 100%)',
          borderBottom: '2px solid #ffd400',
        }}
      >
        <Flex align="center" gap={3} wrap="wrap">
          <Text size={1} weight="semibold" style={{ color: '#ffd400', letterSpacing: 1 }}>
            🏁 REDAZIONE CALIUMI RACING
          </Text>
          <Flex gap={2} wrap="wrap" style={{ marginLeft: 'auto' }}>
            <a href="/studio/structure/redazione;notiziaRedazione" style={{ textDecoration: 'none' }}>
              <Button text="✍️ Nuovo articolo" mode="ghost" tone="primary" fontSize={1} padding={2} />
            </a>
            <a href="/studio/structure/redazione;richiestaArticolo" style={{ textDecoration: 'none' }}>
              <Button text="🤖 Chiedi all'IA" mode="ghost" tone="primary" fontSize={1} padding={2} />
            </a>
            <a href="/studio/structure/commentiDaApprovare" style={{ textDecoration: 'none' }}>
              <Button text="💬 Commenti" mode="ghost" tone="primary" fontSize={1} padding={2} />
            </a>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button text="🌐 Vedi sito" mode="default" tone="primary" fontSize={1} padding={2} />
            </a>
          </Flex>
        </Flex>
      </Card>
      {props.renderDefault(props)}
    </Flex>
  )
}
