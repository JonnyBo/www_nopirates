<?php
namespace app\daemons;

use consik\yii2websocket\events\WSClientEvent;
use consik\yii2websocket\events\WSClientMessageEvent;
use consik\yii2websocket\WebSocketServer;
use Ratchet\ConnectionInterface;
use Yii;


class NotificationServer extends WebSocketServer
{

    public function init()
    {
        parent::init();

        $this->on(self::EVENT_CLIENT_CONNECTED, function(WSClientEvent $e) {
            $e->client->user = 23;
            //$e->client->send(json_encode("Connection established!"));
        });
/*
        $this->on(self::EVENT_CLIENT_MESSAGE, function (WSClientMessageEvent $e) {
            $e->client->send( 'Ответ: ' . $e->message );
        });
*/
    }

    protected function getCommand(ConnectionInterface $from, $msg)
    {
        $request = json_decode($msg, true);
        return !empty($request['action']) ? $request['action'] : parent::getCommand($from, $msg);
    }

    public function commandNotifications(ConnectionInterface $client, $msg) {
        $request = json_decode($msg, true);
        $result = ['message' => ''];
        //ищем количество непрочитанных уведомлений
        $message = rand(0, 9);
        if ($message > 0) {
            if (!empty($request['user']) && $user_id = trim($request['user'])) {
                foreach ($this->clients as $myClient) {
                    if ($myClient->user == $user_id) {
                        $result['message'] = $message;
                        $myClient->send(json_encode($result));
                    }

                }
            }
        }
        $client->send( json_encode($result) );
    }

    public function commandChat(ConnectionInterface $client, $msg)
    {
        $request = json_decode($msg, true);
        $result = ['message' => ''];

        if (!$client->name) {
            $result['message'] = 'Set your name';
        } elseif (!empty($request['message']) && $message = trim($request['message']) ) {
            foreach ($this->clients as $chatClient) {
                $chatClient->send( json_encode([
                    'type' => 'chat',
                    'from' => $client->name,
                    'message' => $message
                ]) );
            }
        } else {
            $result['message'] = 'Enter message';
        }

        $client->send( json_encode($result) );
    }

    public function commandSetName(ConnectionInterface $client, $msg)
    {
        $request = json_decode($msg, true);
        $result = ['message' => 'Username updated'];

        if (!empty($request['name']) && $name = trim($request['name'])) {
            $usernameFree = true;
            foreach ($this->clients as $chatClient) {
                if ($chatClient != $client && $chatClient->name == $name) {
                    $result['message'] = 'This name is used by other user';
                    $usernameFree = false;
                    break;
                }
            }

            if ($usernameFree) {
                $client->name = $name;
            }
        } else {
            $result['message'] = 'Invalid username';
        }

        $client->send( json_encode($result) );
    }
}