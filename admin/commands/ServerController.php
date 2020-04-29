<?php
namespace app\commands;

use app\daemons\NotificationServer;
use consik\yii2websocket\WebSocketServer;
use yii\console\Controller;
use WebSocket\Client;

class ServerController extends Controller
{
    public function actionStart()
    {
        //$server = new WebSocketServer();
        $server = new NotificationServer();
        $server->port = 8786; //This port must be busy by WebServer and we handle an error

        $server->on(WebSocketServer::EVENT_WEBSOCKET_OPEN_ERROR, function($e) use($server) {
            echo "Error opening port " . $server->port . "\n";
            $server->port += 1; //Try next port to open
            $server->start();
        });

        $server->on(WebSocketServer::EVENT_WEBSOCKET_OPEN, function($e) use($server) {
            echo "Server started at port " . $server->port;
        });

        $server->start();
    }

    public function actionSend() {
        $client = new Client("ws://localhost:8786");
        $client->send(json_encode(['action' => 'notifications', 'user' => '23']));

        echo $client->receive(); // Will output 'Hello WebSocket.org!'
    }
}