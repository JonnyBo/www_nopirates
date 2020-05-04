<?php
/*
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://www.wtfpl.net/ for more details.
 */

namespace alxmsl\Vkontakte\OAuth;
use alxmsl\Network\Http\Request;

/**
 * VK OAuth client
 * @author alxmsl
 * @date 3/30/13
 */
class Client {
    /**
     * Response type constants
     */
    const   RESPONSE_TYPE_TOKEN = 'token',
            RESPONSE_TYPE_CODE  = 'code';

    /**
     * Display type constants
     */
    const   DISPLAY_TYPE_PAGE   = 'page',
            DISPLAY_TYPE_POPUP  = 'popup',
            DISPLAY_TYPE_TOUCH  = 'touch',
            DISPLAY_TYPE_WAP    = 'wap',
            DISPLAY_TYPE_MOBILE = 'mobile';

    /**
     * Standard redirect uri
     */
    const REDIRECT_URI_BLANK = 'https://oauth.vk.com/blank.html';

    /**
     * Application server authorization grant type
     */
    const GRANT_TYPE_CLIENT_CREDENTIALS = 'client_credentials';

    /**
     * Service endpoints
     */
    const   ENDPOINT_AUTHORIZE_REQUEST = 'https://oauth.vk.com/authorize',
            ENDPOINT_ACCESS_TOKEN_REQUEST = 'https://oauth.vk.com/access_token';

    /**
     * @var string client identifier
     */
    private $clientId = '';

    /**
     * @var string client secret
     */
    private $clientSecret = '';

    /**
     * @var string redirect uri
     */
    private $redirectUri = self::REDIRECT_URI_BLANK;

    /**
     * @var int connect timeout, seconds
     */
    private $connectTimeout = 0;

    /**
     * @var int request timeout, seconds
     */
    private $requestTimeout = 0;

    /**
     * Getter for the request
     * @param string $url request url
     * @return Request request object
     */
    protected function getRequest($url) {
        $Request = new Request();
        $Request->setTransport(Request::TRANSPORT_CURL);
        return $Request->setUrl($url)
            ->setConnectTimeout($this->getConnectTimeout())
            ->setTimeout($this->getRequestTimeout());
    }

    /**
     * Create authorization url
     * @param array $scopes needed scopes
     * @param string $responseType OAuth response type
     * @param string $display display mode
     * @return string authorization url
     */
    public function createAuthUrl(array $scopes, $responseType = self::RESPONSE_TYPE_TOKEN, $display = self::DISPLAY_TYPE_PAGE) {
        $parameters = array(
            'client_id' => $this->getClientId(),
            'scope' => implode(',', $scopes),
            'redirect_uri' => $this->getRedirectUri(),
            'display' => $display,
            'response_type' => $responseType,
        );
        return self::ENDPOINT_AUTHORIZE_REQUEST . '?' . implode('&', $parameters);
    }

    /**
     * Setter for client identifier
     * @param string $clientId client identifier
     * @return Client self
     */
    public function setClientId($clientId) {
        $this->clientId = $clientId;
        return $this;
    }

    /**
     * Client identifier getter
     * @return string client identifier getter
     */
    public function getClientId() {
        return $this->clientId;
    }

    /**
     * Setter for redirect uri
     * @param string $redirectUri redirect uri setter
     * @return Client self
     */
    public function setRedirectUri($redirectUri) {
        $this->redirectUri = $redirectUri;
        return $this;
    }

    /**
     * Getter for redirect uri
     * @return string redirect uri
     */
    public function getRedirectUri() {
        return $this->redirectUri;
    }

    /**
     * Setter for client secret code
     * @param string $clientSecret client secret code
     * @return Client self
     */
    public function setClientSecret($clientSecret) {
        $this->clientSecret = $clientSecret;
        return $this;
    }

    /**
     * Getter for client secret code
     * @return string client secret code
     */
    public function getClientSecret() {
        return $this->clientSecret;
    }

    /**
     * Setter for connect timeout value
     * @param int $connectTimeout connect timeout, seconds
     * @return Client self
     */
    public function setConnectTimeout($connectTimeout) {
        $this->connectTimeout = (int) $connectTimeout;
        return $this;
    }

    /**
     * Getter for connect timeout value
     * @return int connect timeout, seconds
     */
    public function getConnectTimeout() {
        return $this->connectTimeout;
    }

    /**
     * Setter for request timeout value
     * @param int $requestTimeout request timeout, seconds
     * @return Client self
     */
    public function setRequestTimeout($requestTimeout) {
        $this->requestTimeout = (int) $requestTimeout;
        return $this;
    }

    /**
     * Getter for request timeout value
     * @return int request timeout, seconds
     */
    public function getRequestTimeout() {
        return $this->requestTimeout;
    }
}