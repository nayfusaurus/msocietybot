import { ScriberBot } from './Scriber';
import { Message as TelegramMessage, User as TelegramUser, Chat as TelegramChat } from 'telegram-typings';
import { User } from '../entity/User';
import { Chat } from '../entity/Chat';
import { Message } from '../entity/Message';

describe('Scriber', () => {
  const assertMessageContains = async <E = {}>(containing: E, relations?: string[]) => {
    const messages = await entityManager.find(Message, { relations: relations ? relations : Object.keys(containing) });

    expect(messages.length).toEqual(1);
    expect(messages[0]).toStrictEqual(expect.objectContaining(containing));
  };

  describe('insert user into db if does not exists', () => {
    const userAbu = createTelegramUser();

    const assert = async () => {
      const users = await entityManager.find(User);

      expect(users.length).toEqual(1);
      expect(users[0]).toStrictEqual(
        expect.objectContaining({
          id: userAbu.id,
          firstName: userAbu.first_name,
          lastName: userAbu.last_name,
          username: userAbu.username,
        }),
      );
      expect(users[0].createdAt).not.toBeNull();
      expect(users[0].updatedAt).not.toBeNull();
    };

    it('from', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: createTelegramChat(),
          date: new Date().getTime(),
          from: userAbu,
        };
        sendMessage(message);
      });

      await assert();
      await assertMessageContains({ sender: expect.objectContaining({ id: userAbu.id }) });
    });

    it('forward_from', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: createTelegramChat(),
          date: new Date().getTime(),
          forward_from: userAbu,
        };
        sendMessage(message);
      });

      await assert();
      await assertMessageContains({ forwardFrom: expect.objectContaining({ id: userAbu.id }) });
    });

    it('new_chat_members', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: createTelegramChat(),
          date: new Date().getTime(),
          new_chat_members: [userAbu],
        };
        sendMessage(message);
      });

      await assert();
      await assertMessageContains({ usersJoined: [expect.objectContaining({ id: userAbu.id })] });
    });

    it('left_chat_member', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: createTelegramChat(),
          date: new Date().getTime(),
          left_chat_member: userAbu,
        };
        sendMessage(message);
      });

      await assert();
      await assertMessageContains({ userLeft: expect.objectContaining({ id: userAbu.id }) });
    });
  });

  it('update user in db if exists', async () => {
    const existingUser = await createUserInDb();

    const userAbu = createTelegramUser();
    await runBot([ScriberBot], ({ sendMessage }) => {
      const newMemberMessage: TelegramMessage = {
        message_id: -1,
        chat: {
          id: -100000,
          type: 'group',
        },
        date: new Date().getTime(),
        new_chat_members: [userAbu],
      };
      sendMessage(newMemberMessage);
    });

    const users = await entityManager.find(User);

    expect(users.length).toEqual(1);
    expect(users[0]).toStrictEqual(
      expect.objectContaining({
        id: userAbu.id,
        firstName: userAbu.first_name,
        lastName: userAbu.last_name,
        username: userAbu.username,
      }),
    );
    expect(users[0].createdAt).toEqual(existingUser.createdAt);
    expect(users[0].updatedAt).not.toEqual(existingUser.updatedAt);
  });

  describe('insert chat into db if does not exists', () => {
    const telegramChat = createTelegramChat();

    const assert = async (totalChats = 1, chat: TelegramChat = telegramChat) => {
      const chats = await entityManager.find(Chat);

      expect(chats.length).toEqual(totalChats);
      expect(chats[totalChats - 1]).toStrictEqual(
        expect.objectContaining({
          id: chat.id,
          type: chat.type,
          title: chat.title,
        }),
      );
      expect(chats[totalChats - 1].createdAt).not.toBeNull();
      expect(chats[totalChats - 1].updatedAt).not.toBeNull();
    };

    it('chat', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: telegramChat,
          date: new Date().getTime(),
        };
        sendMessage(message);
      });

      await assert();
      await assertMessageContains({ chat: expect.objectContaining({ id: telegramChat.id }) });
    });

    it('forward_from_chat', async () => {
      await runBot([ScriberBot], ({ sendMessage }) => {
        const chat = createTelegramChat();
        chat.id = -100;
        chat.title = 'Some old chat title';
        const message: TelegramMessage = {
          message_id: -1,
          chat: chat,
          forward_from_chat: telegramChat,
          date: new Date().getTime(),
        };
        sendMessage(message);
      });

      await assert(2);
      await assertMessageContains({ forwardFromChat: expect.objectContaining({ id: telegramChat.id }) });
    });

    it('private', async () => {
      const userAbu = createTelegramUser();
      const privateChat = createTelegramChat(userAbu);
      await runBot([ScriberBot], ({ sendMessage }) => {
        const message: TelegramMessage = {
          message_id: -1,
          chat: privateChat,
          date: new Date().getTime(),
        };
        sendMessage(message);
      });

      await assertMessageContains(
        {
          chat: expect.objectContaining({ user: expect.objectContaining({ id: userAbu.id }) }),
        },
        ['chat', 'chat.user'],
      );
    });
  });

  it('update chat in db if exists', async () => {
    const existingChat = await createChatInDb('group');

    const telegramChat = createTelegramChat();
    await runBot([ScriberBot], ({ sendMessage }) => {
      const message: TelegramMessage = {
        message_id: -1,
        chat: telegramChat,
        date: new Date().getTime(),
      };
      sendMessage(message);
    });

    const chats = await entityManager.find(Chat);

    expect(chats.length).toEqual(1);
    expect(chats[0]).toStrictEqual(
      expect.objectContaining({
        id: existingChat.id,
        type: existingChat.type,
      }),
    );
    expect(chats[0].createdAt).toEqual(existingChat.createdAt);
    expect(chats[0].updatedAt).not.toEqual(existingChat.updatedAt);
  });

  it('insert chat and user into db if does not exists', async () => {
    const telegramChat = createTelegramChat(createTelegramUser());
    await runBot([ScriberBot], ({ sendMessage }) => {
      const message: TelegramMessage = {
        message_id: -1,
        chat: telegramChat,
        date: new Date().getTime(),
      };
      sendMessage(message);
    });

    const chats = await entityManager.find(Chat);

    expect(chats.length).toEqual(1);
    expect(chats[0]).toStrictEqual(
      expect.objectContaining({
        id: telegramChat.id,
        type: telegramChat.type,
      }),
    );
    expect(chats[0].createdAt).not.toBeNull();
    expect(chats[0].updatedAt).not.toBeNull();

    const users = await entityManager.find(User);

    expect(users.length).toEqual(1);
    expect(users[0]).toStrictEqual(
      expect.objectContaining({
        id: telegramChat.id,
        firstName: telegramChat.first_name,
        lastName: telegramChat.last_name,
        username: telegramChat.username,
      }),
    );
    expect(users[0].createdAt).not.toBeNull();
    expect(users[0].updatedAt).not.toBeNull();
  });

  it('insert message into db if does not exists', async () => {
    const telegramMessage = createTelegramMessage();
    telegramMessage.text = 'hello world';
    await runBot([ScriberBot], ({ sendMessage }) => {
      sendMessage(telegramMessage);
    });

    const messages = await entityManager.find(Message);

    expect(messages.length).toEqual(1);
    expect(messages[0]).toStrictEqual(
      expect.objectContaining({
        id: telegramMessage.message_id,
        unixtime: telegramMessage.date,
        text: telegramMessage.text,
      }),
    );
    expect(messages[0].createdAt).not.toBeNull();
    expect(messages[0].updatedAt).not.toBeNull();
  });

  it('insert reply message into db if does not exists', async () => {
    const telegramRepliedMessage = createTelegramMessage();
    telegramRepliedMessage.message_id = 12345;
    telegramRepliedMessage.text = 'some absurd thing here';
    const telegramMessage = createTelegramMessage();
    telegramMessage.text = 'hello world';
    telegramMessage.reply_to_message = telegramRepliedMessage;
    await runBot([ScriberBot], ({ sendMessage }) => {
      sendMessage(telegramMessage);
    });

    const messages = await entityManager.find(Message, { relations: ['replyToMessage'] });

    expect(messages.length).toEqual(2);
    expect(messages[0]).toStrictEqual(
      expect.objectContaining({
        id: telegramRepliedMessage.message_id,
        unixtime: telegramRepliedMessage.date,
        text: telegramRepliedMessage.text,
      }),
    );
    expect(messages[0].createdAt).not.toBeNull();
    expect(messages[0].updatedAt).not.toBeNull();
    expect(messages[1]).toStrictEqual(
      expect.objectContaining({
        id: telegramMessage.message_id,
        unixtime: telegramMessage.date,
        text: telegramMessage.text,
        replyToMessage: expect.objectContaining({
          id: telegramRepliedMessage.message_id,
        }),
      }),
    );
    expect(messages[1].createdAt).not.toBeNull();
    expect(messages[1].updatedAt).not.toBeNull();
  });

  it('insert reply message into db if does not exists but original message exists', async () => {
    const telegramRepliedMessage = createTelegramMessage();
    telegramRepliedMessage.message_id = 12345;
    telegramRepliedMessage.text = 'some absurd thing here';
    const telegramMessage = createTelegramMessage();
    telegramMessage.text = 'hello world';
    telegramMessage.reply_to_message = telegramRepliedMessage;
    const chat = await createChatInDb(telegramMessage.chat.type);
    await createMessageInDb(chat, telegramRepliedMessage.message_id);

    await runBot([ScriberBot], ({ sendMessage }) => {
      sendMessage(telegramMessage);
    });

    const messages = await entityManager.find(Message, { relations: ['replyToMessage'] });

    expect(messages.length).toEqual(2);
    expect(messages[0]).toStrictEqual(
      expect.objectContaining({
        id: telegramRepliedMessage.message_id,
        unixtime: telegramRepliedMessage.date,
        text: telegramRepliedMessage.text,
      }),
    );
    expect(messages[0].createdAt).not.toBeNull();
    expect(messages[0].updatedAt).not.toBeNull();
    expect(messages[1]).toStrictEqual(
      expect.objectContaining({
        id: telegramMessage.message_id,
        unixtime: telegramMessage.date,
        text: telegramMessage.text,
        replyToMessage: expect.objectContaining({
          id: telegramRepliedMessage.message_id,
        }),
      }),
    );
    expect(messages[1].createdAt).not.toBeNull();
    expect(messages[1].updatedAt).not.toBeNull();
  });
});

async function createUserInDb() {
  try {
    const user = entityManager.create(User, {
      id: 2,
      firstName: 'AbuBakr',
      lastName: '',
      username: null,
    });
    return await entityManager.save(user);
  } catch (e) {
    console.error(e);
  }
}

async function createChatInDb(type: string) {
  try {
    const chat = entityManager.create(Chat, {
      id: -10000,
      type,
    });
    return await entityManager.save(chat);
  } catch (e) {
    console.error(e);
  }
}

async function createMessageInDb(chat: Chat, id = 1) {
  try {
    const message = entityManager.create(Message, {
      id,
      unixtime: new Date().getTime(),
      text: 'Some text here',
      chat: chat,
    });
    return await entityManager.save(message);
  } catch (e) {
    console.error(e);
  }
}

function createTelegramUser(): TelegramUser {
  return {
    id: 2,
    is_bot: false,
    first_name: 'Abu',
    last_name: 'Bakr',
    username: 'abu_bakr',
  };
}

function createTelegramChat(typeOrUser?: string | TelegramUser): TelegramChat {
  const fields: Record<string, string | number> = {};
  if (typeof typeOrUser === 'string') {
    fields['type'] = typeOrUser;
  } else if (typeOrUser) {
    fields['id'] = typeOrUser.id;
    fields['first_name'] = typeOrUser.first_name;
    fields['last_name'] = typeOrUser.last_name;
    fields['username'] = typeOrUser.username;
    fields['type'] = 'private';
  }

  if (fields['type'] !== 'private') {
    fields['title'] = 'Some chat title';
  }

  return {
    id: -10000,
    type: 'group',
    ...fields,
  };
}

function createTelegramMessage(
  chat: TelegramChat = createTelegramChat(),
  user: TelegramUser = createTelegramUser(),
): TelegramMessage {
  return {
    message_id: 10,
    date: new Date().getTime(),
    chat: chat,
    from: user,
  };
}
