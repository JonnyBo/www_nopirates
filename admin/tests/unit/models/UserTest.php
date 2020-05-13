<?php

namespace tests\unit\models;

use app\models\ProjectAdmin;

class UserTest extends \Codeception\Test\Unit
{
    public function testFindUserById()
    {
        expect_that($user = ProjectAdmin::findIdentity(100));
        expect($user->username)->equals('admin');

        expect_not(ProjectAdmin::findIdentity(999));
    }

    public function testFindUserByAccessToken()
    {
        expect_that($user = ProjectAdmin::findIdentityByAccessToken('100-token'));
        expect($user->username)->equals('admin');

        expect_not(ProjectAdmin::findIdentityByAccessToken('non-existing'));
    }

    public function testFindUserByUsername()
    {
        expect_that($user = ProjectAdmin::findByUsername('admin'));
        expect_not(ProjectAdmin::findByUsername('not-admin'));
    }

    /**
     * @depends testFindUserByUsername
     */
    public function testValidateUser($user)
    {
        $user = ProjectAdmin::findByUsername('admin');
        expect_that($user->validateAuthKey('test100key'));
        expect_not($user->validateAuthKey('test102key'));

        expect_that($user->validatePassword('admin'));
        expect_not($user->validatePassword('123456'));        
    }

}
