"use client"

import { Card, Image, Text, Badge, Button, Group, Box, Tooltip } from '@mantine/core';
import { useRouter } from 'next/navigation';

type MealCardProps = {
  thumbnail: string;
  mealTitle: string;
  mealID: string
};

export default function MealCard({ thumbnail, mealTitle, mealID }: MealCardProps) {
  const router = useRouter();

  const handleChatClick = () => {
    router.push(`/protected/chat/${mealID}`);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={thumbnail}
          height={160}
          alt="Picture of meal"
        />
      </Card.Section>

      <Box mt="md" mb="md" style={{ minHeight: '60px' }}>
        <Group align="flex-start" justify="space-between">
          <Tooltip 
            label={mealTitle} 
            multiline 
            position="bottom" 
            withArrow
            transitionProps={{ duration: 200 }}
          >
            <Text fw={500} style={{ flex: 1 }} lineClamp={2}>{mealTitle}</Text>
          </Tooltip>
          <Badge color="pink">On Sale</Badge>
        </Group>
      </Box>

      <Button color="blue" fullWidth mt="auto" radius="md" onClick={handleChatClick}>
        Chat
      </Button>
    </Card>
  );
}